
window.addEventListener('load', async (event) => {

    const req = await fetch('data/content.json');
    const content = await req.json();

    initGameFromContent(content);

    loadCacheFromContent(content);
    displayGridFromContent(content);

});

const loadCacheFromContent = (content) => {
    const assetList = [];

    content.forEach(c => {
        assetList.push(c.previewImage);
        assetList.push(...c.videos);
        assetList.push(c.explanationVideo);
    });

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
            console.log('[Content Loader] Service worker actif, chargement des ressources');
            let customEvent = new CustomEvent('cache-loading');
            window.dispatchEvent(customEvent);

            var promises = [];
            assetList.forEach(e => promises.push(fetch(e)));
            Promise.all(promises).then(() => {
                customEvent = new CustomEvent('cache-done');
                window.dispatchEvent(customEvent);
            });

        });
    }
};

const displayGridFromContent = (content) => {
    const grid = document.querySelector('#scenari-grid');
    const scenarioTemplate = document.querySelector('#scenario-template');

    let i = 0;
    content.forEach(c => {
        const clone = scenarioTemplate.content.cloneNode(true);
        const j = i;
        const img = clone.querySelector('.scenario-image img');
        img.setAttribute('src', c.previewImage);
        img.setAttribute('alt', c.title);
        clone.querySelector('.scenario-text').textContent = c.title;
        clone.querySelector('.scenario-description').textContent = c.subTitle;
        clone.children[0].addEventListener('click', e => {
            selectScenario(c, j);
        });
        grid.appendChild(clone);
        i++;
    });
};

const selectScenario = (scenario, index) => {
        const customEvent = new CustomEvent('scenario-selected', { detail: {scenario, index} });
        window.dispatchEvent(customEvent);
};

const initGameFromContent = (content) => {
    const customEvent = new CustomEvent('content-fetched', { detail: {content} });
    window.dispatchEvent(customEvent);
}





