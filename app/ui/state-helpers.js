(function (global) {
    const setVehicleStatus = (ctx, text, loading) => {
        ctx.vehiclePlaceholder = text;
        ctx.vehicleMessageLoading = !!loading;
    };

    const setRecallStatus = (ctx, text, loading) => {
        ctx.recallPlaceholder = text;
        ctx.recallMessageLoading = !!loading;
    };

    const setSuperEtkaStatus = (ctx, text, loading) => {
        ctx.superEtkaPlaceholder = text;
        ctx.superEtkaMessageLoading = !!loading;
    };

    const resetLookupState = (ctx) => {
        ctx.result = null;
        ctx.loading = true;
        ctx.message = '';
        setVehicleStatus(ctx, 'Preparing request…', true);
        setRecallStatus(ctx, 'Awaiting vehicle lookup…', true);
        setSuperEtkaStatus(ctx, 'Awaiting vehicle lookup…', true);
        ctx.recallStatusNote = '';
        ctx.recallPlaceholderVisible = true;
        ctx.showVehicleContent = false;
        ctx.showRecallContent = false;
        ctx.showKosmocarResults = false;
        ctx.stopSuperEtkaQueuePolling();
        ctx.superEtka = {
            found: false,
            checked: false,
            prHtml: '',
            codingHtml: ''
        };
        ctx.superEtkaRevealReady = false;
        ctx.superEtkaQueue.position = '0/0';
        ctx.superEtkaQueue.loading = false;
        ctx.superEtkaQueue.error = '';
        ctx.superEtkaQueue.comment = '';
        ctx.superEtkaQueue.enqueued = false;
        ctx.superEtkaQueue.status = '';
    };

    const showLookupError = (ctx, message) => {
        ctx.message = message;
        ctx.loading = false;
        ctx.vehicleMessageLoading = false;
        ctx.recallMessageLoading = false;
        ctx.superEtkaMessageLoading = false;
        setVehicleStatus(ctx, 'Run a lookup to view vehicle details.', false);
        setRecallStatus(ctx, 'Run a lookup to view recall history.', false);
        setSuperEtkaStatus(ctx, 'Run a lookup — SuperETKA dossier will display here.', false);
        ctx.recallStatusNote = '';
        ctx.recallPlaceholderVisible = true;
        ctx.showVehicleContent = false;
        ctx.showRecallContent = false;
        ctx.showKosmocarResults = false;
        ctx.scrollToSection();
    };

    global.StateHelpers = {
        setVehicleStatus,
        setRecallStatus,
        setSuperEtkaStatus,
        resetLookupState,
        showLookupError
    };
})(window);
