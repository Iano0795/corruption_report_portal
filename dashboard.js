document.addEventListener('DOMContentLoaded', async () => {
    const reportsContainer = document.getElementById('reports');

    try {
        const response = await fetch('http://localhost:4300/api/reports');
        const reports = await response.json();

        reports.forEach(report => {
            const reportCard = document.createElement('div');
            reportCard.classList.add('report-card');

            reportCard.innerHTML = `
                <h3>${report.accused} - ${report.position}</h3>
                <p><strong>Description:</strong> ${report.description}</p>
                <p><strong>Location:</strong> ${report.location_incidence}</p>
                <p><strong>Date:</strong> ${new Date(report.date).toLocaleDateString()}</p>
            `;

            if (report.media_type === 'image') {
                const img = document.createElement('img');
                img.src = report.media_url; // Assuming media_url is a valid URL for the image
                reportCard.appendChild(img);
            } else if (report.media_type === 'video') {
                const video = document.createElement('video');
                video.src = report.media_url; // Assuming media_url is a valid URL for the video
                video.controls = true;
                reportCard.appendChild(video);
            }

            reportsContainer.appendChild(reportCard);
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
    }
});
