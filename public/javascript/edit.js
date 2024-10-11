document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const expenseId = urlParams.get('id');
    
    if (!expenseId) {
        alert('No expense selected for editing');
        return;
    }

    try {
        // Fetch the expense data to populate the form
        const response = await fetch(`/api/expenses/${expenseId}`);
        const expense = await response.json();

        if (!expense) {
            alert('Expense not found');
            return;
        }

        // Populate form fields with the existing expense data
        document.getElementById('expense-category').value = expense.category;
        document.getElementById('expense-amount').value = expense.amount;
        document.getElementById('expense-date').value = expense.expense_date.split('T')[0]; // Format date
        document.getElementById('expense-note').value = expense.notes;

        // Handle form submission for updating the expense
        document.getElementById('edit-expense-form').addEventListener('submit', async function(event) {
            event.preventDefault();

            const updatedExpense = {
                category: document.getElementById('expense-category').value,
                amount: parseFloat(document.getElementById('expense-amount').value),
                date: document.getElementById('expense-date').value,
                notes: document.getElementById('expense-note').value || ''
            };

            try {
                const updateResponse = await fetch(`/api/expenses/${expenseId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedExpense)
                });

                if (updateResponse.ok) {
                    alert('Expense updated successfully');
                    window.location.href = 'view_expense.html'; // Redirect to view page
                } else {
                    alert('Failed to update expense');
                }
            } catch (error) {
                console.error('Error updating expense:', error);
                alert('An error occurred while updating the expense.');
            }
        });
    } catch (error) {
        console.error('Error fetching expense details:', error);
        alert('An error occurred while loading the expense data.');
    }
});
