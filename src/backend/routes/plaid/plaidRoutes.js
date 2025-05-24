import express from 'express';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { query } from '../../db.js';
import authenticate from '../../middlewares/authenticate.js';
import crypto from 'crypto';

const router = express.Router();

// Plaid client config
const configuration = new Configuration({
  basePath: process.env.NODE_ENV === 'production'
    ? PlaidEnvironments.production
    : PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});
const plaidClient = new PlaidApi(configuration);

// Encryption helpers
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  console.error('ERROR: ENCRYPTION_KEY environment variable must be 32 characters');
  process.exit(1);
}
function encryptToken(token) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(token);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}
function decryptToken(encryptedToken) {
  const textParts = encryptedToken.split(':');
  const iv = Buffer.from(textParts[0], 'hex');
  const encryptedText = Buffer.from(textParts[1], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// -- Helpers --
async function getTransactionsWithRetry(client, access_token, start_date, end_date, maxRetries = 4) {
  let lastError = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.transactionsGet({
        access_token,
        start_date,
        end_date,
        options: { count: 500, offset: 0 }
      });
    } catch (error) {
      const code = error?.response?.data?.error_code;
      lastError = error;
      if (code === 'PRODUCT_NOT_READY') {
        const waitMs = 1200 * (i + 1);
        console.warn(`[Plaid] PRODUCT_NOT_READY – retrying in ${waitMs}ms (attempt ${i + 1}/${maxRetries})`);
        await new Promise(res => setTimeout(res, waitMs));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}
async function processTransaction(transaction, userId, accountId) {
  if (transaction.pending) return false;
  try {
    await query(
      `INSERT INTO transactions 
        (user_id, bank_account_id, plaid_transaction_id, amount, transaction_date, description, merchant_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (plaid_transaction_id) DO UPDATE SET
         amount = EXCLUDED.amount,
         transaction_date = EXCLUDED.transaction_date,
         description = EXCLUDED.description,
         merchant_name = EXCLUDED.merchant_name,
         updated_at = NOW()`,
      [
        userId,
        accountId,
        transaction.transaction_id,
        transaction.amount,
        transaction.date,
        transaction.name,
        transaction.merchant_name || null
      ]
    );
    return true;
  } catch (error) {
    console.error(`Error processing transaction ${transaction.transaction_id}:`, error);
    return false;
  }
}

// -- Plaid Endpoints --

// 1. Create Link token
router.post('/link-token', authenticate, async (req, res) => {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: req.user.user_id },
      client_name: 'AgencyTax',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    });
    res.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error('Error creating link token:', error.response?.data || error);
    res.status(500).json({
      message: 'Error creating link token',
      error: error.response?.data?.error_message || error.message,
    });
  }
});

// 2. Exchange public token, save encrypted access token, store accounts
router.post('/exchange-token', authenticate, async (req, res) => {
  const { public_token } = req.body;
  if (!public_token) return res.status(400).json({ message: 'Missing public token' });

  try {
    const response = await plaidClient.itemPublicTokenExchange({ public_token });
    const access_token = response.data.access_token;
    const item_id = response.data.item_id;
    const encryptedToken = encryptToken(access_token);

    const accountsResponse = await plaidClient.accountsGet({ access_token });
    const accounts = [];
    for (const account of accountsResponse.data.accounts) {
      try {
        const result = await query(
          `INSERT INTO bank_accounts 
            (user_id, plaid_account_id, plaid_access_token, account_name, account_type, last_four)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (plaid_account_id) DO UPDATE SET
             plaid_access_token = $3,
             account_name = $4,
             account_type = $5,
             last_four = $6,
             updated_at = NOW()
           RETURNING account_id, account_name`,
          [
            req.user.user_id,
            account.account_id,
            encryptedToken,
            account.name,
            account.type,
            account.mask
          ]
        );
        if (result.rows.length > 0) accounts.push(result.rows[0]);
      } catch (error) {
        console.error(`Error saving account ${account.account_id}:`, error);
      }
    }
    // Audit log (non-critical)
    try {
      await query(
        `INSERT INTO audit_logs (actor_user_id, action, table_name, metadata)
         VALUES ($1, $2, $3, $4)`,
        [
          req.user.user_id,
          'LINKED_BANK',
          'bank_accounts',
          JSON.stringify({ item_id, accounts_count: accounts.length, timestamp: new Date() })
        ]
      );
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }
    res.json({
      message: 'Bank account linked successfully',
      accounts: accounts.map(a => ({ id: a.account_id, name: a.account_name }))
    });
  } catch (error) {
    console.error('Error exchanging token:', error.response?.data || error);
    res.status(500).json({
      message: 'Error linking bank account',
      error: error.response?.data?.error_message || error.message
    });
  }
});

// 3. Initial sync - full transaction history (with PRODUCT_NOT_READY retry)
router.post('/sync/initial', authenticate, async (req, res) => {
  try {
    const accountsResult = await query(
      'SELECT account_id, plaid_access_token, account_name FROM bank_accounts WHERE user_id = $1 AND is_active = true',
      [req.user.user_id]
    );
    if (accountsResult.rows.length === 0) {
      return res.status(404).json({ message: 'No bank accounts found' });
    }
    let totalImported = 0;
    let errors = [];
    const startDate = '2025-01-01';
    const endDate = new Date().toISOString().split('T')[0];

    for (const account of accountsResult.rows) {
      try {
        const access_token = decryptToken(account.plaid_access_token);
        const transactionsResponse = await getTransactionsWithRetry(plaidClient, access_token, startDate, endDate);
        let allTransactions = transactionsResponse.data.transactions;
        const totalTransactions = transactionsResponse.data.total_transactions;
        // Pagination
        while (allTransactions.length < totalTransactions) {
          const paginatedResponse = await getTransactionsWithRetry(plaidClient, access_token, startDate, endDate);
          allTransactions = allTransactions.concat(paginatedResponse.data.transactions);
        }
        for (const transaction of allTransactions) {
          if (!transaction.pending) {
            const processed = await processTransaction(transaction, req.user.user_id, account.account_id);
            if (processed) totalImported++;
          }
        }
        await query(
          'UPDATE bank_accounts SET last_sync = NOW(), is_initial_sync_complete = true WHERE account_id = $1',
          [account.account_id]
        );
      } catch (error) {
        console.error(`Error syncing account ${account.account_id}:`, error);
        errors.push(`Failed to sync ${account.account_name}: ${error.message}`);
      }
    }
    // Audit log (non-critical)
    try {
      await query(
        `INSERT INTO audit_logs (actor_user_id, action, metadata)
         VALUES ($1, $2, $3)`,
        [
          req.user.user_id,
          'INITIAL_SYNC',
          JSON.stringify({
            imported: totalImported,
            accounts: accountsResult.rows.length,
            date_range: { start: startDate, end: endDate },
            timestamp: new Date()
          })
        ]
      );
    } catch (auditError) { console.error('Error creating audit log:', auditError); }
    res.json({
      message: 'Initial sync completed',
      imported: totalImported,
      dateRange: { start: startDate, end: endDate },
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in initial sync:', error);
    res.status(500).json({
      message: 'Error syncing transactions',
      error: error.message
    });
  }
});

// 4. Monthly sync - fetch only new transactions (no retry)
router.post('/sync/monthly', authenticate, async (req, res) => {
  try {
    const accountsResult = await query(
      'SELECT account_id, plaid_access_token, account_name FROM bank_accounts WHERE user_id = $1 AND is_active = true AND is_initial_sync_complete = true',
      [req.user.user_id]
    );
    if (accountsResult.rows.length === 0) {
      return res.status(404).json({ message: 'No bank accounts ready for monthly sync' });
    }
    let totalImported = 0;
    let errors = [];
    for (const account of accountsResult.rows) {
      try {
        const access_token = decryptToken(account.plaid_access_token);
        const response = await plaidClient.transactionsSync({ access_token });
        if (response.data.added.length > 0) {
          for (const transaction of response.data.added) {
            if (new Date(transaction.date) >= new Date('2025-01-01') && !transaction.pending) {
              const processed = await processTransaction(transaction, req.user.user_id, account.account_id);
              if (processed) totalImported++;
            }
          }
        }
        for (const transaction of response.data.modified) {
          if (new Date(transaction.date) >= new Date('2025-01-01') && !transaction.pending) {
            try {
              await query(
                `UPDATE transactions
                 SET amount = $1, transaction_date = $2, description = $3, merchant_name = $4, updated_at = NOW()
                 WHERE plaid_transaction_id = $5 AND user_id = $6`,
                [
                  transaction.amount,
                  transaction.date,
                  transaction.name,
                  transaction.merchant_name || null,
                  transaction.transaction_id,
                  req.user.user_id
                ]
              );
            } catch (updateError) {
              console.error(`Error updating transaction ${transaction.transaction_id}:`, updateError);
            }
          }
        }
        for (const transaction of response.data.removed) {
          try {
            await query(
              `DELETE FROM transactions
               WHERE plaid_transaction_id = $1 AND user_id = $2`,
              [transaction.transaction_id, req.user.user_id]
            );
          } catch (deleteError) {
            console.error(`Error deleting transaction ${transaction.transaction_id}:`, deleteError);
          }
        }
        await query('UPDATE bank_accounts SET last_sync = NOW() WHERE account_id = $1', [account.account_id]);
      } catch (error) {
        console.error(`Error syncing account ${account.account_id}:`, error);
        errors.push(`Failed to sync ${account.account_name}: ${error.message}`);
      }
    }
    try {
      await query(
        `INSERT INTO audit_logs (actor_user_id, action, metadata)
         VALUES ($1, $2, $3)`,
        [
          req.user.user_id,
          'MONTHLY_SYNC',
          JSON.stringify({
            imported: totalImported,
            accounts: accountsResult.rows.length,
            timestamp: new Date()
          })
        ]
      );
    } catch (auditError) { console.error('Error creating audit log:', auditError); }
    res.json({
      message: 'Monthly sync completed',
      imported: totalImported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in monthly sync:', error);
    res.status(500).json({
      message: 'Error syncing transactions',
      error: error.message
    });
  }
});

// 5. Combined sync endpoint
router.post('/sync', authenticate, async (req, res) => {
  try {
    const accountsResult = await query(
      `SELECT COUNT(*) as needs_initial 
       FROM bank_accounts 
       WHERE user_id = $1 AND is_active = true AND 
       (is_initial_sync_complete IS NULL OR is_initial_sync_complete = false)`,
      [req.user.user_id]
    );
    const needsInitial = parseInt(accountsResult.rows[0].needs_initial) > 0;
    if (needsInitial) {
      req.url = '/sync/initial';
      return router.handle(req, res);
    } else {
      req.url = '/sync/monthly';
      return router.handle(req, res);
    }
  } catch (error) {
    console.error('Error determining sync type:', error);
    res.status(500).json({
      message: 'Error syncing transactions',
      error: error.message
    });
  }
});

// 6. Get user's linked banks
router.get('/banks', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT 
         account_id, 
         account_name, 
         account_type, 
         last_four, 
         last_sync,
         is_initial_sync_complete,
         (
           SELECT COUNT(*) 
           FROM transactions 
           WHERE bank_account_id = b.account_id
         ) as transaction_count
       FROM bank_accounts b
       WHERE user_id = $1 AND is_active = true
       ORDER BY account_name`,
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching banks:', error);
    res.status(500).json({
      message: 'Error fetching banks',
      error: error.message
    });
  }
});

// 7. Disconnect bank account (soft delete)
router.delete('/banks/:accountId', authenticate, async (req, res) => {
  const { accountId } = req.params;
  try {
    const verifyResult = await query(
      'SELECT account_id FROM bank_accounts WHERE account_id = $1 AND user_id = $2',
      [accountId, req.user.user_id]
    );
    if (verifyResult.rows.length === 0) {
      return res.status(404).json({ message: 'Bank account not found' });
    }
    await query('UPDATE bank_accounts SET is_active = false, updated_at = NOW() WHERE account_id = $1', [accountId]);
    try {
      await query(
        `INSERT INTO audit_logs (actor_user_id, action, table_name, record_id, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.user.user_id,
          'DISCONNECT_BANK',
          'bank_accounts',
          accountId,
          JSON.stringify({ timestamp: new Date() })
        ]
      );
    } catch (auditError) { console.error('Error creating audit log:', auditError); }
    res.json({ message: 'Bank account disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting bank account:', error);
    res.status(500).json({
      message: 'Error disconnecting bank account',
      error: error.message
    });
  }
});

export default router;
