(function (global) {
    const baseUrl = 'https://superetka.com/etka';

    const buildHtmlLinks = (vin) => ({
        prHtml: `${baseUrl}/ajaxIdentCarPrint&lang=EN&vin=${vin}`,
        codingHtml: `${baseUrl}/ajaxCarPortPrint&lang=EN&vin=${vin}`
    });

    const fetchQueueStatus = async (queueApi, vin) => {
        const resp = await fetch(`${queueApi}?action=status&vin=${encodeURIComponent(vin)}`);
        if (!resp.ok) return { ok: false };
        const data = await resp.json();
        const status = (data.status || '').toLowerCase();
        return {
            ok: true,
            position: data.position || '0/0',
            decodedCount: data.decodedCount,
            status
        };
    };

    const fetchQueueStats = async (queueApi) => {
        const resp = await fetch(`${queueApi}?action=stats`);
        if (!resp.ok) return { ok: false };
        const data = await resp.json();
        return { ok: true, decodedCount: data.decodedCount };
    };

    const enqueueVin = async (queueApi, vin, comment = '') => {
        const commentParam = comment ? `&comment=${encodeURIComponent(comment)}` : '';
        const resp = await fetch(`${queueApi}?action=add&vin=${encodeURIComponent(vin)}${commentParam}`);
        if (!resp.ok) return { ok: false };
        const data = await resp.json();
        return {
            ok: true,
            position: data.position || '0/0',
            decodedCount: data.decodedCount,
            status: (data.status || 'pending').toLowerCase()
        };
    };

    global.SuperEtkaApi = {
        buildHtmlLinks,
        fetchQueueStatus,
        fetchQueueStats,
        enqueueVin
    };
})(window);
