
        // Global Data
        const budgetLimits = {
            'Food & Dining': 5000,
            'Transportation': 3000,
            'Utilities': 2000,
            'Entertainment': 2000,
            'Salary': Infinity,
            'Freelance': Infinity,
            'Bonus': Infinity,
            'Investment Returns': Infinity
        };

        const categoryMap = {
            'Salary': 'Food & Dining',
            'Freelance': 'Food & Dining',
            'Bonus': 'Entertainment',
            'Investment Returns': 'Entertainment',
            'Food': 'Food & Dining',
            'Groceries': 'Food & Dining',
            'Restaurants': 'Food & Dining',
            'Bus': 'Transportation',
            'Taxi': 'Transportation',
            'Petrol': 'Transportation',
            'Electricity': 'Utilities',
            'Water': 'Utilities',
            'Internet': 'Utilities',
            'Movies': 'Entertainment',
            'Games': 'Entertainment',
            'Sports': 'Entertainment'
        };

        let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        let currentMonth = new Date();

        // Initialize the app
        function initializeApp() {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('date').value = today;

            updateMonthDisplay();
            updateDisplay();
        }

        // Run initialization when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeApp);
        } else {
            initializeApp();
        }

        function updateMonthDisplay() {
            const options = { month: 'long', year: 'numeric' };
            document.getElementById('monthDisplay').textContent = currentMonth.toLocaleDateString('en-US', options);
        }

        function updateCategories() {
            const type = document.getElementById('type').value;
            const categorySelect = document.getElementById('category');
            categorySelect.innerHTML = '';

            const categories = type === 'income' 
                ? ['Salary', 'Freelance', 'Bonus', 'Investment Returns']
                : ['Food & Dining', 'Transportation', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare', 'Other'];

            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                categorySelect.appendChild(option);
            });
        }

        function addTransaction() {
            const type = document.getElementById('type').value;
            const category = document.getElementById('category').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const description = document.getElementById('description').value;
            const date = document.getElementById('date').value;

            if (!date) {
                alert('Please select a date');
                return;
            }

            if (!amount || amount <= 0 || isNaN(amount)) {
                alert('Please enter a valid amount');
                return;
            }

            try {
                const transaction = {
                    id: Date.now(),
                    type,
                    category,
                    amount,
                    description,
                    date,
                    budgetCategory: categoryMap[category] || category
                };

                transactions.push(transaction);
                localStorage.setItem('transactions', JSON.stringify(transactions));

                // Reset form
                document.getElementById('amount').value = '';
                document.getElementById('description').value = '';
                document.getElementById('date').valueAsDate = new Date();
                
                // Show success message
                alert('✅ Transaction added successfully!');
                updateDisplay();
            } catch (error) {
                console.error('Error adding transaction:', error);
                alert('Error adding transaction. Please try again.');
            }
        }

        function deleteTransaction(id) {
            transactions = transactions.filter(t => t.id !== id);
            localStorage.setItem('transactions', JSON.stringify(transactions));
            updateDisplay();
        }

        function updateDisplay() {
            const monthTransactions = transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate.getMonth() === currentMonth.getMonth() && tDate.getFullYear() === currentMonth.getFullYear();
            });

            let totalIncome = 0, totalExpense = 0;
            const categoryExpenses = {};

            monthTransactions.forEach(t => {
                if (t.type === 'income') {
                    totalIncome += t.amount;
                } else {
                    totalExpense += t.amount;
                    const budgetCat = t.budgetCategory;
                    categoryExpenses[budgetCat] = (categoryExpenses[budgetCat] || 0) + t.amount;
                }
            });

            // Update summary cards
            document.getElementById('totalIncome').textContent = '₹' + totalIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 });
            document.getElementById('totalExpense').textContent = '₹' + totalExpense.toLocaleString('en-IN', { maximumFractionDigits: 0 });
            document.getElementById('netBalance').textContent = '₹' + (totalIncome - totalExpense).toLocaleString('en-IN', { maximumFractionDigits: 0 });

            // Update budget bars
            updateBudgetBar('Food & Dining', 'food', 5000, categoryExpenses);
            updateBudgetBar('Transportation', 'transport', 3000, categoryExpenses);
            updateBudgetBar('Utilities', 'utilities', 2000, categoryExpenses);
            updateBudgetBar('Entertainment', 'entertainment', 2000, categoryExpenses);

            // Update transaction list
            updateTransactionList(monthTransactions);
            updateAnalytics(monthTransactions);
        }

        function updateBudgetBar(category, prefix, limit, expenses) {
            const amount = expenses[category] || 0;
            const percentage = (amount / limit) * 100;
            const bar = document.getElementById(prefix + 'Bar');
            const used = document.getElementById(prefix + 'Used');

            used.textContent = '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
            bar.style.width = Math.min(percentage, 100) + '%';

            if (percentage > 80) {
                bar.className = 'progress-fill danger';
            } else if (percentage > 60) {
                bar.className = 'progress-fill warning';
            } else {
                bar.className = 'progress-fill';
            }
        }

        function updateTransactionList(monthTransactions) {
            const list = document.getElementById('transactionList');
            
            if (monthTransactions.length === 0) {
                list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📝</div><p>No transactions this month</p></div>';
                return;
            }

            const sorted = monthTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            list.innerHTML = sorted.map(t => `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-category">${t.category}</div>
                        <div class="transaction-date">${new Date(t.date).toLocaleDateString('en-IN')}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="transaction-amount ${t.type}">
                            ${t.type === 'income' ? '+' : '−'}₹${t.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                        <button class="btn btn-danger" onclick="deleteTransaction(${t.id})">Delete</button>
                    </div>
                </div>
            `).join('');
        }

        function updateAnalytics(monthTransactions) {
            const expenses = monthTransactions.filter(t => t.type === 'expense');
            const categoryTotals = {};
            updateExpenseChart(expenses);


            expenses.forEach(e => {
                const cat = e.budgetCategory;
                categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
            });

            const summary = document.getElementById('categorySummary');
            if (Object.keys(categoryTotals).length === 0) {
                summary.innerHTML = '<div class="empty-state"><p>Add expenses to see breakdown</p></div>';
                return;
            }

            summary.innerHTML = Object.entries(categoryTotals).map(([cat, amount]) => `
                <div style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <strong>${cat}</strong>
                        <span style="color: #e74c3c;">₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div style="font-size: 12px; color: #7f8c8d;">
                        ${((amount / (expenses.reduce((sum, e) => sum + e.amount, 0))) * 100).toFixed(1)}% of expenses
                    </div>
                </div>
            `).join('');
        }

        function switchTab(tab, event) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
            
            document.getElementById(tab).classList.add('active');
            if (event) event.target.classList.add('active');
        }

        document.getElementById('prevMonth').addEventListener('click', () => {
            currentMonth.setMonth(currentMonth.getMonth() - 1);
            updateMonthDisplay();
            updateDisplay();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            currentMonth.setMonth(currentMonth.getMonth() + 1);
            updateMonthDisplay();
            updateDisplay();
        });

        // Initial display is handled by initializeApp()
function updateExpenseChart(expenses) {
    const chart = document.getElementById('expenseChart');

    if (expenses.length === 0) {
        chart.style.background = '#eee';
        chart.innerHTML = '<div class="center-text">0%</div>';
        return;
    }

    // Calculate totals per category
    const totals = {};
    let totalExpense = 0;

    expenses.forEach(e => {
        totals[e.budgetCategory] = (totals[e.budgetCategory] || 0) + e.amount;
        totalExpense += e.amount;
    });

    // Colors for categories
    const colors = {
        'Food & Dining': '#1ab394',
        'Transportation': '#f39c12',
        'Utilities': '#e74c3c',
        'Entertainment': '#3498db',
        'Other': '#9b59b6'
    };

    let currentAngle = 0;
    const gradientParts = [];

    Object.entries(totals).forEach(([cat, amount]) => {
        const percentage = (amount / totalExpense) * 100;
        const angle = (percentage / 100) * 360;

        gradientParts.push(
            `${colors[cat] || '#95a5a6'} ${currentAngle}deg ${currentAngle + angle}deg`
        );

        currentAngle += angle;
    });

    chart.style.background = `conic-gradient(${gradientParts.join(', ')})`;

    chart.innerHTML = `
        <div class="center-text">
            ₹${totalExpense.toLocaleString('en-IN')}
        </div>
    `;
}
