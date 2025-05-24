import express from 'express';
import { query } from '../../db.js';
import authenticate from '../../middlewares/authenticate.js';

const router = express.Router();

// Profit & Loss Statement
router.get('/profit-loss', authenticate, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { startDate, endDate } = req.query;
    
    // Default to current year if no dates provided
    const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const end = endDate || new Date().toISOString();

    // Get income and expenses by category
    const result = await query(
      `
      SELECT 
        c.name as category_name,
        c.type as category_type,
        c.is_deductible,
        COALESCE(SUM(ABS(t.amount)), 0) as total_amount,
        COUNT(t.transaction_id) as transaction_count
      FROM categories c
      LEFT JOIN transactions t ON c.category_id = t.category_id 
        AND t.user_id = $1 
        AND t.transaction_date BETWEEN $2 AND $3
        AND t.is_reviewed = true
      GROUP BY c.category_id, c.name, c.type, c.is_deductible
      ORDER BY c.type DESC, total_amount DESC
      `,
      [userId, start, end]
    );

    const categories = result.rows;
    
    // Separate income and expenses
    const income = categories.filter(cat => cat.category_type === 'INCOME');
    const expenses = categories.filter(cat => cat.category_type === 'EXPENSE');
    
    // Calculate totals
    const totalIncome = income.reduce((sum, cat) => sum + parseFloat(cat.total_amount), 0);
    const totalExpenses = expenses.reduce((sum, cat) => sum + parseFloat(cat.total_amount), 0);
    const netProfit = totalIncome - totalExpenses;
    
    // Calculate deductible expenses
    const deductibleExpenses = expenses
      .filter(cat => cat.is_deductible)
      .reduce((sum, cat) => sum + parseFloat(cat.total_amount), 0);

    res.json({
      period: { startDate: start, endDate: end },
      summary: {
        totalIncome,
        totalExpenses,
        netProfit,
        deductibleExpenses
      },
      income,
      expenses
    });
  } catch (err) {
    console.error('Error generating P&L:', err);
    res.status(500).json({ message: 'Failed to generate profit & loss report' });
  }
});

// Monthly Summary Report
router.get('/monthly-summary', authenticate, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { year } = req.query;
    const targetYear = year || new Date().getFullYear();

    const result = await query(
      `
      SELECT 
        EXTRACT(MONTH FROM t.transaction_date) as month,
        TO_CHAR(t.transaction_date, 'Month') as month_name,
        COALESCE(SUM(CASE WHEN c.type = 'INCOME' THEN ABS(t.amount) ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN c.type = 'EXPENSE' THEN ABS(t.amount) ELSE 0 END), 0) as expenses,
        COALESCE(SUM(CASE WHEN c.type = 'EXPENSE' AND c.is_deductible = true THEN ABS(t.amount) ELSE 0 END), 0) as deductible_expenses
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = $1 
        AND EXTRACT(YEAR FROM t.transaction_date) = $2
        AND t.is_reviewed = true
      GROUP BY EXTRACT(MONTH FROM t.transaction_date), TO_CHAR(t.transaction_date, 'Month')
      ORDER BY month
      `,
      [userId, targetYear]
    );

    const monthlyData = result.rows.map(row => ({
      month: parseInt(row.month),
      monthName: row.month_name.trim(),
      income: parseFloat(row.income) || 0,
      expenses: parseFloat(row.expenses) || 0,
      deductibleExpenses: parseFloat(row.deductible_expenses) || 0,
      netProfit: (parseFloat(row.income) || 0) - (parseFloat(row.expenses) || 0)
    }));

    res.json({ year: targetYear, months: monthlyData });
  } catch (err) {
    console.error('Error generating monthly summary:', err);
    res.status(500).json({ message: 'Failed to generate monthly summary' });
  }
});

// Tax Report (Deductible Expenses Summary)
router.get('/tax-summary', authenticate, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { year } = req.query;
    const targetYear = year || new Date().getFullYear();
    
    const startOfYear = new Date(targetYear, 0, 1).toISOString();
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59).toISOString();

    // Get deductible expenses by category
    const deductibleResult = await query(
      `
      SELECT 
        c.name as category_name,
        COALESCE(SUM(ABS(t.amount)), 0) as total_amount,
        COUNT(t.transaction_id) as transaction_count
      FROM categories c
      LEFT JOIN transactions t ON c.category_id = t.category_id 
        AND t.user_id = $1 
        AND t.transaction_date BETWEEN $2 AND $3
        AND t.is_reviewed = true
      WHERE c.type = 'EXPENSE' AND c.is_deductible = true
      GROUP BY c.category_id, c.name
      HAVING COALESCE(SUM(ABS(t.amount)), 0) > 0
      ORDER BY total_amount DESC
      `,
      [userId, startOfYear, endOfYear]
    );

    // Get total income for tax calculations
    const incomeResult = await query(
      `
      SELECT COALESCE(SUM(ABS(t.amount)), 0) as total_income
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = $1 
        AND t.transaction_date BETWEEN $2 AND $3
        AND c.type = 'INCOME'
        AND t.is_reviewed = true
      `,
      [userId, startOfYear, endOfYear]
    );

    const deductibleExpenses = deductibleResult.rows.map(row => ({
      categoryName: row.category_name,
      amount: parseFloat(row.total_amount),
      transactionCount: parseInt(row.transaction_count)
    }));

    const totalIncome = parseFloat(incomeResult.rows[0]?.total_income) || 0;
    const totalDeductible = deductibleExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const estimatedTaxSavings = totalDeductible * 0.30; // Assuming 30% tax rate

    res.json({
      year: targetYear,
      totalIncome,
      totalDeductible,
      estimatedTaxSavings,
      deductibleExpenses
    });
  } catch (err) {
    console.error('Error generating tax summary:', err);
    res.status(500).json({ message: 'Failed to generate tax summary' });
  }
});

// Export Data (CSV format)
router.get('/export', authenticate, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { format, startDate, endDate } = req.query;
    
    const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const end = endDate || new Date().toISOString();

    const result = await query(
      `
      SELECT 
        t.transaction_date,
        t.description,
        t.merchant_name,
        t.amount,
        c.name as category,
        c.type as transaction_type,
        c.is_deductible,
        ba.account_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.category_id
      LEFT JOIN bank_accounts ba ON t.bank_account_id = ba.account_id
      WHERE t.user_id = $1 
        AND t.transaction_date BETWEEN $2 AND $3
        AND t.is_reviewed = true
      ORDER BY t.transaction_date DESC
      `,
      [userId, start, end]
    );

    if (format === 'csv') {
      // Generate CSV
      const headers = ['Date', 'Description', 'Merchant', 'Amount', 'Category', 'Type', 'Deductible', 'Account'];
      const csvRows = [headers.join(',')];
      
      result.rows.forEach(row => {
        const values = [
          new Date(row.transaction_date).toLocaleDateString(),
          `"${row.description || ''}"`,
          `"${row.merchant_name || ''}"`,
          row.amount,
          `"${row.category || 'Uncategorized'}"`,
          row.transaction_type || '',
          row.is_deductible ? 'Yes' : 'No',
          `"${row.account_name || ''}"`
        ];
        csvRows.push(values.join(','));
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
      res.send(csvRows.join('\n'));
    } else {
      // Return JSON by default
      res.json({ transactions: result.rows });
    }
  } catch (err) {
    console.error('Error exporting data:', err);
    res.status(500).json({ message: 'Failed to export data' });
  }
});

export default router;