(function (global) {
    const scrollToSection = (ctx, refName = 'resultsPanel') => {
        if (!ctx || typeof ctx.$nextTick !== 'function') return;
        ctx.$nextTick(() => {
            const target = ctx.$refs?.[refName] || ctx.$refs?.resultsPanel;
            target?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
        });
    };

    const revealRecallsContent = (ctx) => {
        if (!ctx) return;
        const hidePlaceholder = () => {
            ctx.recallPlaceholderVisible = false;
            setTimeout(() => {
                ctx.recallMessageLoading = false;
                ctx.recallPlaceholder = '';
                setTimeout(() => {
                    ctx.showRecallContent = true;
                    scrollToSection(ctx, 'recallPanel');
                }, 80);
            }, 200);
        };
        if (typeof window !== 'undefined') {
            requestAnimationFrame(hidePlaceholder);
        } else {
            hidePlaceholder();
        }
    };

    const revealKosmocarResults = (ctx, hasRecalls) => {
        if (!ctx) return;
        ctx.showKosmocarResults = false;
        if (!hasRecalls) return;
        const trigger = () => setTimeout(() => (ctx.showKosmocarResults = true), 200);
        if (typeof window !== 'undefined' && window.requestAnimationFrame) {
            requestAnimationFrame(() => requestAnimationFrame(trigger));
        } else {
            trigger();
        }
    };

    global.UiHelpers = {
        scrollToSection,
        revealRecallsContent,
        revealKosmocarResults
    };
})(window);
