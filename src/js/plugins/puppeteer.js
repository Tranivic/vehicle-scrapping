exports.prevent_resource_download = async (recivedPage) => {
    await recivedPage.setRequestInterception(true);

    recivedPage.on('request', (req) => {
        const resourceType = req.resourceType();
        if (
            resourceType === 'image' ||
            resourceType === 'stylesheet' ||
            resourceType === 'font' ||
            resourceType === 'script' ||
            resourceType === 'media' ||
            resourceType === 'texttrack' ||
            resourceType === 'xhr' ||
            resourceType === 'fetch' ||
            resourceType === 'eventsource' ||
            resourceType === 'websocket' ||
            resourceType === 'manifest' ||
            resourceType === 'other'
        ) {
            req.abort();
        } else {
            req.continue();
        }
    });
};
