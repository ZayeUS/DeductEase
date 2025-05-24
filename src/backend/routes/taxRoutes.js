// src/backend/routes/taxRoutes.js
import express from 'express';
import { query } from '../db.js';
import authenticate from '../middlewares/authenticate.js';

const router = express.Router();

// Helper functions
function getTaxRateByBusinessType(businessType) {
  let estimatedRate = 0.25; // Default 25%
  if (businessType === 'sole_proprietor') estimatedRate = 0.30; 
  if (businessType === 's_corp') estimatedRate = 0.22;
  if (businessType === 'c_corp') estimatedRate = 0.21;
  return estimatedRate;
}

function calculateSavings(deductions, businessType) {
  const rate = getTaxRateByBusinessType(businessType);
  return parseFloat((deductions * rate).toFixed(2));
}

function calculateROI(savings, monthlyFee, subscriptionMonths) {
  const totalSpent = monthlyFee * subscriptionMonths;
  return totalSpent > 0 ? parseFloat((savings / totalSpent).toFixed(1)) : 0;
}

function calculateAnnualROI(savings, monthlyFee) {
  const annualFee = monthlyFee * 12;
  return savings > 0 ? parseFloat((savings / annualFee).toFixed(1)) : 0;
}

// Disclaimer helper function
function getDisclaimer() {
  return {
    type: 'ESTIMATE_ONLY',
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    text: 'IMPORTANT: These calculations are estimates for informational purposes only and should not be considered tax, legal, or financial advice. Actual tax liability may differ significantly. Tax laws are complex and change frequently. Always consult with a qualified tax professional or CPA before making tax-related decisions. AgencyTax is not responsible for any decisions made based on these estimates.',
    legalWarning: 'This tool does not constitute tax advice and should not be relied upon for tax preparation or filing. Users are responsible for their own tax compliance.',
    accuracyWarning: 'Calculations use simplified rules and may not reflect your actual tax situation. Many factors affecting taxes are not included in these estimates.'
  };
}

// Simple summary endpoint - just income vs expenses
router.get('/summary', authenticate, async (req, res) => {
  try {
    // Remember: In Plaid, negative = income, positive = expenses
    const result = await query(`
      SELECT 
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_income,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_expenses
      FROM transactions
      WHERE user_id = $1
      AND transaction_date >= '2025-01-01'
    `, [req.user.user_id]);
    
    res.json({
      income: result.rows[0].total_income || 0,
      expenses: result.rows[0].total_expenses || 0,
      net: (result.rows[0].total_income || 0) - (result.rows[0].total_expenses || 0)
    });
  } catch (error) {
    console.error('Error calculating summary:', error);
    res.status(500).json({ message: 'Error calculating summary' });
  }
});

// Tax savings endpoint
router.get('/tax-savings', authenticate, async (req, res) => {
  try {
    // Get business type first for consistent tax rate calculations
    const profileRes = await query(
      'SELECT business_type FROM profiles WHERE user_id = $1',
      [req.user.user_id]
    );
    const businessType = profileRes.rows[0]?.business_type || 'sole_proprietor';
    const estimatedRate = getTaxRateByBusinessType(businessType);
    
    // Get reviewed deductible expenses
    const reviewedDeductibles = await query(`
      SELECT 
        c.name as category_name,
        SUM(t.amount) as total_amount
      FROM transactions t
      JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = $1 
      AND t.is_reviewed = true
      AND c.is_deductible = true
      AND t.transaction_date >= '2025-01-01'
      GROUP BY c.name
      ORDER BY total_amount DESC
    `, [req.user.user_id]);
    
    // Get unreviewed but categorized deductible expenses
    const unreviewedDeductibles = await query(`
      SELECT 
        c.name as category_name,
        SUM(t.amount) as total_amount
      FROM transactions t
      JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = $1 
      AND t.is_reviewed = false
      AND c.is_deductible = true
      AND t.transaction_date >= '2025-01-01'
      GROUP BY c.name
      ORDER BY total_amount DESC
    `, [req.user.user_id]);
    
    // Process reviewed transactions
    const reviewedCategories = reviewedDeductibles.rows.map(category => ({
      category: category.category_name,
      amount: parseFloat(category.total_amount),
      estimatedSavings: calculateSavings(parseFloat(category.total_amount), businessType),
      status: 'reviewed'
    }));
    
    // Process unreviewed transactions
    const unreviewedCategories = unreviewedDeductibles.rows.map(category => ({
      category: category.category_name,
      amount: parseFloat(category.total_amount),
      estimatedSavings: calculateSavings(parseFloat(category.total_amount), businessType),
      status: 'unreviewed'
    }));
    
    // Calculate totals for both
    const totalReviewedDeductible = reviewedCategories.reduce((sum, cat) => sum + cat.amount, 0);
    const totalReviewedSavings = calculateSavings(totalReviewedDeductible, businessType);
    
    const totalUnreviewedDeductible = unreviewedCategories.reduce((sum, cat) => sum + cat.amount, 0);
    const totalUnreviewedSavings = calculateSavings(totalUnreviewedDeductible, businessType);
    
    const totalDeductible = totalReviewedDeductible + totalUnreviewedDeductible;
    const totalSavings = totalReviewedSavings + totalUnreviewedSavings;
    
    // Calculate ROI
    const monthlyFee = 50;
    const annualFee = monthlyFee * 12;
    const annualROI = calculateAnnualROI(totalSavings, monthlyFee);
    
    res.json({
      reviewedCategories,
      unreviewedCategories,
      totals: {
        reviewed: {
          deductible: totalReviewedDeductible,
          savings: totalReviewedSavings
        },
        unreviewed: {
          deductible: totalUnreviewedDeductible,
          savings: totalUnreviewedSavings
        },
        combined: {
          deductible: totalDeductible,
          savings: totalSavings
        }
      },
      estimatedRate: parseFloat((estimatedRate * 100).toFixed(1)),
      roi: {
        monthlyCost: monthlyFee,
        annualCost: annualFee,
        annualROI: annualROI,
        savingsPerDollarSpent: annualROI
      },
      dateGenerated: new Date().toISOString(),
      disclaimer: getDisclaimer()
    });
    
  } catch (error) {
    console.error('Error calculating tax savings:', error);
    res.status(500).json({ message: 'Error calculating tax savings' });
  }
});

// Tax liability endpoint
router.get('/tax-liability', authenticate, async (req, res) => {
  try {
    // CHECK FOR UNREVIEWED TRANSACTIONS FIRST
    const unreviewedCheck = await query(`
      SELECT COUNT(*) as unreviewed_count 
      FROM transactions 
      WHERE user_id = $1 AND is_reviewed = false
    `, [req.user.user_id]);
    
    const unreviewedCount = parseInt(unreviewedCheck.rows[0].unreviewed_count);
    
    if (unreviewedCount > 0) {
      return res.json({
        status: 'review_required',
        unreviewedCount: unreviewedCount,
        message: 'Transactions need review before tax calculations',
        canCalculate: false,
        disclaimer: getDisclaimer()
      });
    }
    
    // 1. Fetch business type from profile
    const profileRes = await query(
      'SELECT business_type FROM profiles WHERE user_id = $1',
      [req.user.user_id]
    );
    const businessType = profileRes.rows[0]?.business_type || 'sole_proprietor';
    const isSelfEmployed = ['sole_proprietor', 'llc'].includes(businessType.toLowerCase());

    // 2. Pull income & expenses
    const result = await query(`
      SELECT 
        SUM(CASE 
          WHEN t.amount < 0 AND c.type = 'INCOME' THEN ABS(t.amount)
          WHEN t.amount > 0 AND c.type = 'INCOME' THEN t.amount
          ELSE 0 
        END) as gross_income,
        SUM(CASE 
          WHEN t.amount > 0 AND c.type = 'EXPENSE' AND c.is_deductible THEN t.amount
          ELSE 0 
        END) as deductible_expenses
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = $1 AND t.transaction_date >= '2025-01-01'
    `, [req.user.user_id]);

    const grossIncome = parseFloat(result.rows[0].gross_income) || 0;
    const deductibleExpenses = parseFloat(result.rows[0].deductible_expenses) || 0;
    const netProfit = grossIncome - deductibleExpenses;

    // 3. ESTIMATED Self-employment tax (simplified calculation)
    let estimatedSelfEmploymentTax = 0;
    if (isSelfEmployed && netProfit > 0) {
      // Note: This is a simplified calculation
      estimatedSelfEmploymentTax = netProfit * 0.9235 * 0.153;
    }

    // 4. ESTIMATED Taxable income (simplified)
    const estimatedTaxableIncome = Math.max(0, netProfit - (estimatedSelfEmploymentTax / 2));

    // 5. ESTIMATED Federal income tax (simplified brackets)
    // IMPORTANT: These are 2024 tax brackets and may not reflect current rates
    let estimatedFederalTax = 0;
    let taxCalculationNote = '';
    
    if (estimatedTaxableIncome <= 11850) {
      estimatedFederalTax = estimatedTaxableIncome * 0.10;
      taxCalculationNote = 'Using simplified 2024 tax brackets';
    } else if (estimatedTaxableIncome <= 48300) {
      estimatedFederalTax = 1185 + (estimatedTaxableIncome - 11850) * 0.12;
      taxCalculationNote = 'Using simplified 2024 tax brackets';
    } else if (estimatedTaxableIncome <= 95750) {
      estimatedFederalTax = 5559 + (estimatedTaxableIncome - 48300) * 0.22;
      taxCalculationNote = 'Using simplified 2024 tax brackets';
    } else {
      estimatedFederalTax = 16009 + (estimatedTaxableIncome - 95750) * 0.24;
      taxCalculationNote = 'Using simplified 2024 tax brackets';
    }

    // 6. ESTIMATED total tax liability
    const estimatedTotalTaxLiability = estimatedSelfEmploymentTax + estimatedFederalTax;

    // Get business type specific rate for comparing with other endpoint calculations
    const estimatedRate = getTaxRateByBusinessType(businessType);

    // CRITICAL: Add comprehensive disclaimer and warnings
    res.json({
      // Keep original field names for frontend compatibility
      grossIncome,
      deductibleExpenses,
      netProfit,
      selfEmploymentTax: parseFloat(estimatedSelfEmploymentTax.toFixed(2)),
      taxableIncome: parseFloat(estimatedTaxableIncome.toFixed(2)),
      federalTax: parseFloat(estimatedFederalTax.toFixed(2)),
      totalTaxLiability: parseFloat(estimatedTotalTaxLiability.toFixed(2)),
      
      // Keep original field names
      quarterlyPayment: parseFloat((estimatedTotalTaxLiability / 4).toFixed(2)),
      monthlySetAside: parseFloat((estimatedTotalTaxLiability / 12).toFixed(2)),
      effectiveRate: grossIncome > 0 ? parseFloat(((estimatedTotalTaxLiability / grossIncome) * 100).toFixed(2)) : 0,
      
      // Calculation metadata
      calculationDate: new Date().toISOString(),
      taxYear: 2024, // Make it clear which tax year brackets are used
      businessType: businessType,
      
      // Add estimated rate for consistency with other endpoints
      estimatedRate: parseFloat((estimatedRate * 100).toFixed(1)),
      
      // Warnings and disclaimers
      warnings: [
        'These calculations are estimates only',
        'Based on simplified 2024 tax brackets',
        'Does not include state or local taxes',
        'Does not account for deductions, credits, or other tax factors',
        'Actual tax liability may vary significantly'
      ],
      
      // Legal disclaimer
      disclaimer: getDisclaimer(),
      
      // Additional context
      notes: {
        calculation: taxCalculationNote,
        methodology: 'Simplified calculation using basic tax rates',
        limitations: [
          'Does not include standard deduction',
          'Does not account for filing status',
          'Does not include state taxes',
          'Does not factor in tax credits',
          'Uses previous year tax brackets'
        ]
      },
      
      // Professional advice recommendation
      professionalAdvice: {
        recommended: true,
        message: 'These estimates should not be used for tax filing. Consult a qualified tax professional.',
        resources: [
          {
            name: 'IRS Directory of Federal Tax Return Preparers',
            url: 'https://irs.treasury.gov/rpo/rpo.jsf'
          },
          {
            name: 'Find a CPA',
            url: 'https://www.aicpa.org/forthepublic/findacpa'
          }
        ]
      }
    });

  } catch (err) {
    console.error('Error calculating tax estimates:', err);
    res.status(500).json({ 
      message: 'Error calculating tax estimates',
      disclaimer: getDisclaimer()
    });
  }
});



// Transactions endpoints
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        t.transaction_id,
        t.transaction_date,
        t.description,
        t.amount,
        t.category_id,
        t.is_reviewed,
        c.name as category_name,
        CASE 
          WHEN t.category_id IS NULL THEN 'Uncategorized'
          ELSE 'Categorized'
        END as status
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = $1
      AND t.transaction_date >= '2025-01-01'
      ORDER BY t.transaction_date DESC
      LIMIT 100
    `, [req.user.user_id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

// Get available categories
router.get('/categories', authenticate, async (req, res) => {
  try {
    const result = await query(`
      SELECT category_id, name, type, is_deductible 
      FROM categories
      ORDER BY type, name
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Update transaction category
router.put('/transactions/:transactionId/category', authenticate, async (req, res) => {
  const { transactionId } = req.params;
  const { categoryId } = req.body;
  
  try {
    // Verify transaction belongs to user
    const verifyResult = await query(
      'SELECT transaction_id FROM transactions WHERE transaction_id = $1 AND user_id = $2',
      [transactionId, req.user.user_id]
    );
    
    if (verifyResult.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Update category
    await query(
      'UPDATE transactions SET category_id = $1, is_reviewed = true WHERE transaction_id = $2',
      [categoryId, transactionId]
    );
    
    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Error updating category' });
  }
});

// Bulk approve transactions
router.post('/transactions/bulk-approve', authenticate, async (req, res) => {
  const { pattern, categoryId } = req.body;
  
  if (!pattern || !categoryId) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }
  
  try {
    // Find similar unreviewed transactions
    const similarTransactions = await query(`
      SELECT transaction_id, description 
      FROM transactions 
      WHERE user_id = $1 
      AND is_reviewed = false
      AND description ILIKE $2
      LIMIT 100
    `, [req.user.user_id, `%${pattern}%`]);
    
    if (similarTransactions.rows.length === 0) {
      return res.status(404).json({ message: 'No similar transactions found' });
    }
    
    // Extract transaction IDs
    const transactionIds = similarTransactions.rows.map(t => t.transaction_id);
    
    // Update all at once - handle UUIDs properly
    let placeholders = '';
    const params = [categoryId, req.user.user_id];
    
    transactionIds.forEach((id, index) => {
      params.push(id);
      placeholders += index > 0 ? ', $' + (index + 3) : '$' + (index + 3);
    });
    
    await query(`
      UPDATE transactions 
      SET category_id = $1, is_reviewed = true 
      WHERE user_id = $2 AND transaction_id IN (${placeholders})
    `, params);
    
    // Get category name for response
    const categoryResult = await query(
      'SELECT name FROM categories WHERE category_id = $1',
      [categoryId]
    );
    
    const categoryName = categoryResult.rows[0]?.name || 'Selected category';
    
    res.json({ 
      message: `Successfully categorized ${transactionIds.length} transactions as "${categoryName}"`,
      count: transactionIds.length,
      categoryName
    });
    
  } catch (error) {
    console.error('Error bulk approving transactions:', error);
    res.status(500).json({ message: 'Error approving transactions' });
  }
});

export default router;