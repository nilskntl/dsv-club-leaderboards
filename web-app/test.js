async function loadHtmlContent() {
    let url = 'https://raw.githubusercontent.com/nilskntl/dsv-club-leaderboards/master/web-app/leaderboard.html';
    try {
        let response = await fetch(url);
        if (!response.ok) {
            return new Error('Network response was not ok ' + response.statusText);
        }
        return await response.text();
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}

function insertHtmlIntoIframe(iframeId, htmlContent) {
    let iframe = document.getElementById(iframeId);
    let doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();
}
