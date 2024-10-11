document.querySelector('.register-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const profile_name = document.getElementById('profile_name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const country = document.getElementById('country').value;
    const phone_number = document.getElementById('phone').value; // Changed from "number" to "phone_number"

    const registerData = {
        name: name,
        profile_name: profile_name,
        email: email,
        password: password,
        country: country,
        phone_number: phone_number // Ensure the key is "phone_number"
    };

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registerData),
        });

        if (response.ok) {
            alert('Registration successful! You can now log in.');
            window.location.href = 'login.html'; // Redirect to the login page
        } else {
            alert('Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
});
