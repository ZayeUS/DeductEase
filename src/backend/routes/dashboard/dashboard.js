import express from 'express';
import { query } from '../../db.js';
import authenticate from '../../middlewares/authenticate.js';
import { OpenAI } from 'openai'; // v4.x SDK

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const router = express.Router();

router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
    const assumedTaxRate = 0.30;

    // Financial aggregates
    const result = await query(
      `
      SELECT
        COALESCE(SUM(CASE WHEN c.type = 'INCOME' THEN ABS(t.amount) ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN c.type = 'EXPENSE' THEN ABS(t.amount) ELSE 0 END), 0) AS expenses,
        COALESCE(SUM(CASE WHEN c.type = 'EXPENSE' AND c.is_deductible = true THEN ABS(t.amount) ELSE 0 END), 0) AS deductible_expenses
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = $1
        AND t.transaction_date >= $2
      `,
      [userId, startOfYear]
    );

    // Review status
    const unreviewedResult = await query(
      `SELECT COUNT(*) FROM transactions WHERE user_id = $1 AND is_reviewed = false`,
      [userId]
    );
    const unreviewedCount = parseInt(unreviewedResult.rows[0].count, 10) || 0;

    // Calculations
    const income = parseFloat(result.rows[0]?.income) || 0;
    const expenses = parseFloat(result.rows[0]?.expenses) || 0;
    const deductibleExpenses = parseFloat(result.rows[0]?.deductible_expenses) || 0;
    const netProfit = income - expenses;
    const estimatedTaxLiability = parseFloat((netProfit * assumedTaxRate).toFixed(2));

    // --- Generate context with OpenAI ---
    let contextMessage = '';
    try {
      const aiPrompt = `
You are a financial coach for small business owners.
Summarize the user's financial snapshot below into plain English, focusing only on what they need to know and what action to take next. Be blunt and direct, no generic tips, no filler, no soft language.

- YTD Income: $${income}
- YTD Expenses: $${expenses}
- Net Profit: $${netProfit}
- Deductible Expenses: $${deductibleExpenses}
- Estimated Tax Liability: $${estimatedTaxLiability}
- Unreviewed Transactions: ${unreviewedCount}

Address all of these in 2–3 sentences. If transactions need review, call it out directly. Otherwise, focus on tax, profit, or major risk.
`;

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a brutally honest, actionable AI financial advisor." },
          { role: "user", content: aiPrompt }
        ],
        max_tokens: 100,
        temperature: 0.5,
      });

      contextMessage = aiResponse.choices?.[0]?.message?.content?.trim() || '';
    } catch (e) {
      console.error('OpenAI error:', e.message);
      contextMessage = 'Context not available. Try again later.';
    }

    res.json({
      incomeYTD: income,
      expensesYTD: expenses,
      deductibleExpenses,
      netProfit,
      estimatedTaxLiability,
      assumedTaxRate,
      unreviewedTransactions: unreviewedCount,
      date: new Date().toISOString(),
      context: contextMessage
    });
  } catch (err) {
    console.error('Error in /dashboard/stats:', err);
    res.status(500).json({ message: 'Failed to generate dashboard stats' });
  }
});


router.get('/cash-flow', authenticate, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const now = new Date();

    // Get monthly data for the last 6 months
    const monthlyData = await query(
      `
      SELECT 
        EXTRACT(YEAR FROM t.transaction_date) as year,
        EXTRACT(MONTH FROM t.transaction_date) as month,
        TO_CHAR(t.transaction_date, 'Mon') as month_name,
        COALESCE(SUM(CASE WHEN c.type = 'INCOME' THEN ABS(t.amount) ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN c.type = 'EXPENSE' THEN ABS(t.amount) ELSE 0 END), 0) AS expenses
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = $1 
        AND t.transaction_date >= $2
      GROUP BY 
        EXTRACT(YEAR FROM t.transaction_date),
        EXTRACT(MONTH FROM t.transaction_date),
        TO_CHAR(t.transaction_date, 'Mon')
      ORDER BY year, month
      `,
      [userId, new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()]
    );

    // Transform the data
    const cashFlow = monthlyData.rows.map(row => ({
      month: row.month_name,
      income: parseFloat(row.income) || 0,
      expenses: parseFloat(row.expenses) || 0,
      netFlow: (parseFloat(row.income) || 0) - (parseFloat(row.expenses) || 0)
    }));

    res.json({ cashFlow });
  } catch (err) {
    console.error('Error in /dashboard/cash-flow:', err);
    res.status(500).json({ message: 'Failed to generate cash flow data' });
  }
});

export default router;
