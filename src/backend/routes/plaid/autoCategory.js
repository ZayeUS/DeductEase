import express from 'express';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { query } from '../../db.js';
import authenticate from '../../middlewares/authenticate.js';
import { OpenAI } from 'openai';

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

// OpenAI helper
async function getOpenAIResponse(description, merchant_name, amount, categories) {
  const transactionType = amount < 0 ? 'INCOME' : 'EXPENSE';

  const relevantCategories = categories.filter(cat => cat.type === transactionType);

  const prompt = `You are a financial categorization assistant. Given a transaction, you must categorize it using ONLY one of the provided categories.

Transaction details:
- Description: "${description}"
- Merchant: "${merchant_name || 'Unknown'}"
- Amount: ${Math.abs(amount)} (${transactionType})
- Transaction Type: ${transactionType}

Available categories for ${transactionType} transactions:
${relevantCategories.map((cat, index) => `${index + 1}. ${cat.name}`).join('\n')}

Return ONLY the category name exactly as it appears in the list.

Category:`;

  try {
    const response = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a precise categorization assistant. Return ONLY the exact category name from the list above. No extra text.',
        },
        { role: 'user', content: prompt },
      ],
      model: 'gpt-4o-mini',
      temperature: 0.1,
      max_tokens: 50,
    });

    const predictedCategory = response.choices[0].message.content.trim();
    console.log(`Transaction: "${description}" (${transactionType}) -> Predicted: "${predictedCategory}"`);
    return predictedCategory;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

// Main auto-categorization route
router.post('/auto-categorize', authenticate, async (req, res) => {
  try {
    const transactionsResult = await query(`
      SELECT transaction_id, description, merchant_name, amount 
      FROM transactions 
      WHERE user_id = $1 AND category_id IS NULL
      LIMIT 200
    `, [req.user.user_id]);

    if (transactionsResult.rows.length === 0) {
      return res.status(200).json({ message: 'No uncategorized transactions found.', categorized: 0, total: 0 });
    }

    const categoriesResult = await query('SELECT category_id, name, type FROM categories');
    const categoriesMap = {};
    const allCategories = [];

    categoriesResult.rows.forEach(row => {
      categoriesMap[row.name.toLowerCase()] = row.category_id;
      allCategories.push({ name: row.name, type: row.type });
    });

    const rulesResult = await query('SELECT keyword_pattern, category_id FROM category_rules');
    const rules = rulesResult.rows;

    let categorizedCount = 0;
    let errors = [];

    for (const transaction of transactionsResult.rows) {
      const { transaction_id, description, merchant_name, amount } = transaction;

      const rawText = `${description || ''} ${merchant_name || ''}`;
      const cleanText = rawText.toLowerCase().replace(/[^a-z0-9 ]/gi, '');

      let matchedCategoryId = null;

      // Try rule-based match (only for EXPENSES)
      if (amount >= 0) {
        for (const rule of rules) {
          const keyword = rule.keyword_pattern.toLowerCase().replace(/[^a-z0-9 ]/gi, '');
          if (cleanText.includes(keyword)) {
            matchedCategoryId = rule.category_id;
            console.log(`[RULE MATCH] "${rawText}" matched keyword "${keyword}"`);
            break;
          }
        }
      }

      // Fallback to OpenAI
      if (!matchedCategoryId) {
        if (amount >= 0) {
          console.warn(`[RULE MISS] "${rawText}" did not match any keyword. Falling back to OpenAI.`);
        } else {
          console.log(`[SKIP RULE] Negative amount (${amount}). Sending "${rawText}" to OpenAI.`);
        }

        try {
          const predictedCategory = await getOpenAIResponse(description, merchant_name, amount, allCategories);
          let categoryId = categoriesMap[predictedCategory.toLowerCase()];

          if (!categoryId) {
            const lowerPredicted = predictedCategory.toLowerCase();
            for (const [key, value] of Object.entries(categoriesMap)) {
              if (key.includes(lowerPredicted) || lowerPredicted.includes(key)) {
                categoryId = value;
                break;
              }
            }
          }

          if (!categoryId) {
            errors.push(`Transaction ${transaction_id}: No match for "${predictedCategory}"`);
            continue;
          }

          matchedCategoryId = categoryId;
        } catch (error) {
          console.error(`OpenAI error for transaction ${transaction_id}:`, error);
          errors.push(`Transaction ${transaction_id}: OpenAI error - ${error.message}`);
          continue;
        }
      }

      try {
        await query(
          'UPDATE transactions SET category_id = $1, is_reviewed = false WHERE transaction_id = $2',
          [matchedCategoryId, transaction_id]
        );
        categorizedCount++;
      } catch (updateError) {
        console.error(`Error updating transaction ${transaction_id}:`, updateError);
        errors.push(`Failed to update transaction ${transaction_id}: ${updateError.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`Categorization complete. Categorized: ${categorizedCount}/${transactionsResult.rows.length}`);
    res.json({
      message: categorizedCount > 0 ? 'Transactions successfully categorized.' : 'Unable to categorize transactions.',
      categorized: categorizedCount,
      total: transactionsResult.rows.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Error in auto-categorize endpoint:', error);
    res.status(500).json({ message: 'Error categorizing transactions', error: error.message });
  }
});

export default router;
