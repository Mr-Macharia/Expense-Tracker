document.getElementById('expense-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const category = document.getElementById('expense-category').value;
    const notes = document.getElementById('expense-note').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const date = document.getElementById('expense-date').value;

    if (!category || !notes || !amount || !date) {
        alert('Please fill in all fields');
        return;
    }

    const expense = { category, notes, amount, date };

    try {
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(expense),
        });

        if (response.ok) {
            alert('Expense added successfully!');
            window.location.href = 'view_expense.html';
        } else {
            const errorData = await response.json();
            console.error('Error adding expense:', errorData);
            alert('Error adding expense');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while adding the expense.');
    }
});
