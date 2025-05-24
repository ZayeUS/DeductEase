import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  IconButton,
  Menu,
  Divider,
  Alert,
  Pagination,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import {
  Search,
  Filter,
  Download,
  MoreVertical,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
  Trash2,
  Edit,
  ArrowUpDown,
  Plus,
} from "lucide-react";
import { getData, putData, postData } from "../../utils/BackendRequestHelper";

const formatCurrency = (amount) => {
  if (typeof amount !== "number" || isNaN(amount)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const TransactionRow = ({
  transaction,
  isSelected,
  onSelect,
  categories,
  onCategoryUpdate,
  onReviewToggle,
  isUpdating,
}) => {
  const theme = useTheme();
  const [editingCategory, setEditingCategory] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const isIncome = transaction.amount < 0;
  const relevantCategories = categories.filter(
    (cat) => cat.type === (isIncome ? "INCOME" : "EXPENSE")
  );

  const handleCategoryChange = async (categoryId) => {
    await onCategoryUpdate(transaction.transaction_id, categoryId);
    setEditingCategory(false);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <TableRow
      sx={{
        "&:hover": { bgcolor: theme.palette.action.hover },
        borderLeft: !transaction.is_reviewed
          ? `3px solid ${theme.palette.warning.main}`
          : "3px solid transparent",
        opacity: isUpdating ? 0.6 : 1,
      }}
    >
      <TableCell padding="checkbox">
        <Checkbox
          checked={isSelected}
          onChange={(e) =>
            onSelect(transaction.transaction_id, e.target.checked)
          }
          size="small"
        />
      </TableCell>

      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {isIncome ? (
            <TrendingUp size={16} color={theme.palette.success.main} />
          ) : (
            <TrendingDown size={16} color={theme.palette.error.main} />
          )}
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {formatDate(transaction.transaction_date)}
          </Typography>
        </Box>
      </TableCell>

      <TableCell>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
            {transaction.description}
          </Typography>
          {transaction.merchant_name &&
            transaction.merchant_name !== transaction.description && (
              <Typography variant="caption" color="text.secondary">
                {transaction.merchant_name}
              </Typography>
            )}
        </Box>
      </TableCell>

      <TableCell align="right">
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: isIncome
              ? theme.palette.success.main
              : theme.palette.text.primary,
          }}
        >
          {isIncome ? "+" : ""}
          {formatCurrency(transaction.amount)}
        </Typography>
      </TableCell>

      <TableCell>
        {editingCategory ? (
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={transaction.category_id || ""}
              onChange={(e) => handleCategoryChange(e.target.value || null)}
              displayEmpty
              autoFocus
              onBlur={() => setEditingCategory(false)}
            >
              <MenuItem value="">
                <em>Uncategorized</em>
              </MenuItem>
              {relevantCategories.map((category) => (
                <MenuItem
                  key={category.category_id}
                  value={category.category_id}
                >
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {transaction.category_name ? (
              <Chip
                label={transaction.category_name}
                size="small"
                sx={{
                  bgcolor: theme.palette.primary.main + "15",
                  color: theme.palette.primary.main,
                  fontWeight: 500,
                  cursor: "pointer",
                  "&:hover": {
                    bgcolor: theme.palette.primary.main + "25",
                  },
                }}
                onClick={() => setEditingCategory(true)}
              />
            ) : (
              <Chip
                label="Uncategorized"
                size="small"
                color="warning"
                variant="outlined"
                sx={{ cursor: "pointer" }}
                onClick={() => setEditingCategory(true)}
              />
            )}
          </Box>
        )}
      </TableCell>

      <TableCell align="center">
        <IconButton
          size="small"
          onClick={() =>
            onReviewToggle(transaction.transaction_id, !transaction.is_reviewed)
          }
          sx={{
            color: transaction.is_reviewed
              ? theme.palette.success.main
              : theme.palette.warning.main,
          }}
        >
          {transaction.is_reviewed ? (
            <CheckCircle2 size={18} />
          ) : (
            <Circle size={18} />
          )}
        </IconButton>
      </TableCell>

      <TableCell>
        <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
          <MoreVertical size={16} />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem
            onClick={() => {
              setEditingCategory(true);
              handleMenuClose();
            }}
          >
            <Edit size={16} sx={{ mr: 1 }} />
            Edit Category
          </MenuItem>
          <MenuItem
            onClick={() => {
              onReviewToggle(
                transaction.transaction_id,
                !transaction.is_reviewed
              );
              handleMenuClose();
            }}
          >
            {transaction.is_reviewed ? (
              <EyeOff size={16} sx={{ mr: 1 }} />
            ) : (
              <Eye size={16} sx={{ mr: 1 }} />
            )}
            {transaction.is_reviewed ? "Mark Unreviewed" : "Mark Reviewed"}
          </MenuItem>
        </Menu>
      </TableCell>
    </TableRow>
  );
};

export const Transactions = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Data state
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  // Selection state
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 25;

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, categoriesData] = await Promise.all([
        getData("/tax/transactions"),
        getData("/tax/categories"),
      ]);
      setTransactions(transactionsData);
      setCategories(categoriesData);
    } catch (err) {
      setError("Failed to load transactions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter((transaction) => {
      const matchesSearch =
        searchTerm === "" ||
        transaction.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (transaction.merchant_name &&
          transaction.merchant_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      const matchesCategory =
        categoryFilter === "" || transaction.category_id === categoryFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "reviewed" && transaction.is_reviewed) ||
        (statusFilter === "unreviewed" && !transaction.is_reviewed) ||
        (statusFilter === "uncategorized" && !transaction.category_id);

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "income" && transaction.amount < 0) ||
        (typeFilter === "expense" && transaction.amount > 0);

      return matchesSearch && matchesCategory && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "date":
          aValue = new Date(a.transaction_date);
          bValue = new Date(b.transaction_date);
          break;
        case "amount":
          aValue = Math.abs(a.amount);
          bValue = Math.abs(b.amount);
          break;
        case "description":
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Selection handlers
  const handleSelectTransaction = (transactionId, checked) => {
    const newSelected = new Set(selectedTransactions);
    if (checked) {
      newSelected.add(transactionId);
    } else {
      newSelected.delete(transactionId);
    }
    setSelectedTransactions(newSelected);
    setSelectAll(newSelected.size === paginatedTransactions.length);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = new Set(
        paginatedTransactions.map((t) => t.transaction_id)
      );
      setSelectedTransactions(allIds);
    } else {
      setSelectedTransactions(new Set());
    }
    setSelectAll(checked);
  };

  // Update handlers
  const handleCategoryUpdate = async (transactionId, categoryId) => {
    setUpdating(true);
    try {
      await putData(`/tax/transactions/${transactionId}/category`, {
        categoryId,
      });
      setTransactions((prev) =>
        prev.map((t) =>
          t.transaction_id === transactionId
            ? {
                ...t,
                category_id: categoryId,
                category_name:
                  categories.find((c) => c.category_id === categoryId)?.name ||
                  null,
              }
            : t
        )
      );
    } catch (err) {
      setError("Failed to update category");
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleReviewToggle = async (transactionId, isReviewed) => {
    setUpdating(true);
    try {
      await putData(`/tax/transactions/${transactionId}/review`, {
        isReviewed,
      });
      setTransactions((prev) =>
        prev.map((t) =>
          t.transaction_id === transactionId
            ? { ...t, is_reviewed: isReviewed }
            : t
        )
      );
    } catch (err) {
      setError("Failed to update review status");
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  // Bulk operations
  const handleBulkCategorize = async (categoryId) => {
    setUpdating(true);
    try {
      const promises = Array.from(selectedTransactions).map((transactionId) =>
        putData(`/tax/transactions/${transactionId}/category`, { categoryId })
      );
      await Promise.all(promises);

      setTransactions((prev) =>
        prev.map((t) =>
          selectedTransactions.has(t.transaction_id)
            ? {
                ...t,
                category_id: categoryId,
                category_name:
                  categories.find((c) => c.category_id === categoryId)?.name ||
                  null,
              }
            : t
        )
      );
      setSelectedTransactions(new Set());
    } catch (err) {
      setError("Failed to bulk update categories");
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkReview = async (isReviewed) => {
    setUpdating(true);
    try {
      const promises = Array.from(selectedTransactions).map((transactionId) =>
        putData(`/tax/transactions/${transactionId}/review`, { isReviewed })
      );
      await Promise.all(promises);

      setTransactions((prev) =>
        prev.map((t) =>
          selectedTransactions.has(t.transaction_id)
            ? { ...t, is_reviewed: isReviewed }
            : t
        )
      );
      setSelectedTransactions(new Set());
    } catch (err) {
      setError("Failed to bulk update review status");
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Loading transactions...
          </Typography>
          <LinearProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            mb: 1,
            background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.primary.main} 100%)`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: isMobile ? "1.75rem" : "2.125rem",
          }}
        >
          Transactions
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: "1rem",
            fontWeight: 500,
          }}
        >
          Manage and categorize your financial transactions
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 2,
              mb: 3,
            }}
          >
            <TextField
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={20} />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem
                    key={category.category_id}
                    value={category.category_id}
                  >
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="reviewed">Reviewed</MenuItem>
                <MenuItem value="unreviewed">Unreviewed</MenuItem>
                <MenuItem value="uncategorized">Uncategorized</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="income">Income</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Bulk Actions */}
          {selectedTransactions.size > 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 2,
                bgcolor: theme.palette.primary.main + "10",
                borderRadius: 2,
                border: `1px solid ${theme.palette.primary.main}30`,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {selectedTransactions.size} selected
              </Typography>

              <Button
                size="small"
                variant="outlined"
                onClick={() => handleBulkReview(true)}
                disabled={updating}
              >
                Mark Reviewed
              </Button>

              <Button
                size="small"
                variant="outlined"
                onClick={() => handleBulkReview(false)}
                disabled={updating}
              >
                Mark Unreviewed
              </Button>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Bulk Categorize</InputLabel>
                <Select
                  label="Bulk Categorize"
                  onChange={(e) => handleBulkCategorize(e.target.value)}
                  value=""
                  disabled={updating}
                >
                  {categories.map((category) => (
                    <MenuItem
                      key={category.category_id}
                      value={category.category_id}
                    >
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Chip
          label={`${filteredTransactions.length} transactions`}
          color="primary"
          variant="outlined"
        />
        <Chip
          label={`${
            filteredTransactions.filter((t) => !t.is_reviewed).length
          } unreviewed`}
          color="warning"
          variant="outlined"
        />
        <Chip
          label={`${
            filteredTransactions.filter((t) => !t.category_id).length
          } uncategorized`}
          color="error"
          variant="outlined"
        />
      </Box>

      {/* Table */}
      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: theme.palette.grey[50] }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    indeterminate={selectedTransactions.size > 0 && !selectAll}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <Button
                    size="small"
                    onClick={() => {
                      setSortBy("date");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                    endIcon={<ArrowUpDown size={14} />}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Date
                  </Button>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  <Button
                    size="small"
                    onClick={() => {
                      setSortBy("amount");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                    endIcon={<ArrowUpDown size={14} />}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Amount
                  </Button>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Status
                </TableCell>
                {transactions.is_deductible !== null && (
                  <Tooltip
                    title={
                      transactions.deductibility_reason || "No reason provided"
                    }
                  >
                    <Chip
                      label={
                        transactions.is_deductible
                          ? "Deductible ✅"
                          : "Not Deductible"
                      }
                      size="small"
                      color={transactions.is_deductible ? "success" : "default"}
                      variant="outlined"
                      sx={{ fontWeight: 500 }}
                    />
                  </Tooltip>
                )}

                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTransactions.map((transaction) => (
                <TransactionRow
                  key={transaction.transaction_id}
                  transaction={transaction}
                  isSelected={selectedTransactions.has(
                    transaction.transaction_id
                  )}
                  onSelect={handleSelectTransaction}
                  categories={categories}
                  onCategoryUpdate={handleCategoryUpdate}
                  onReviewToggle={handleReviewToggle}
                  isUpdating={updating}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        )}
      </Card>
    </Container>
  );
};
