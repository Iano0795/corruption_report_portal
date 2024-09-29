document.addEventListener('DOMContentLoaded', () => {
    const reportForm = document.getElementById('reportForm');
    const loginForm = document.getElementById('loginForm');
    const fileInput = document.getElementById('evidence');
    
    // Allowed file types and size (10 MB limit for both images and videos)
    const allowedFileTypes = ['image/png', 'image/jpeg', 'image/jpg', 'video/mp4', 'video/mov'];
    const maxFileSize = 10 * 1024 * 1024; // 10 MB

    if (reportForm) {
        reportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(reportForm);
            const file = fileInput.files[0];

            // Validate file if present
            if (file) {
                if (!allowedFileTypes.includes(file.type)) {
                    alert('Invalid file type. Only PNG, JPEG, JPG images, and MP4, MOV videos are allowed.');
                    return;
                }

                if (file.size > maxFileSize) {
                    alert('File size exceeds 10 MB limit.');
                    return;
                }
            }

            try {
                const response = await fetch('/', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    alert('Report submitted successfully');
                    window.location.href = '/';
                } else {
                    alert('Submission failed');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    }

    
        // Login form submission
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
    
                const formData = new FormData(loginForm);
                const username = formData.get('username');
                const password = formData.get('password');
    
                try {
                    const response = await fetch('http://localhost:4300/api/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ username, password })
                    });
    
                    if (response.ok) {
                        // Redirect on successful login
                        window.location.href = '/dashboard';
                    } else {
                        const result = await response.json();
                        alert(result.error || 'Login failed');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('An error occurred. Please try again.');
                }
            });
        }
    
});




