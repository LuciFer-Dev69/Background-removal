/**
 * Rana.bg - Ads Logic
 * Manages AdSense states and events.
 */

window.AdsLogic = {
    refreshAds: function () {
        console.log('Rana.bg: Refreshing Ads...');
        // Standard AdSense push
        try {
            const ads = document.querySelectorAll('.adsbygoogle');
            ads.forEach(ad => {
                if (ad.innerHTML.trim() === '') {
                    (adsbygoogle = window.adsbygoogle || []).push({});
                }
            });
        } catch (e) {
            console.log('AdSense error (expected in dev/local):', e);
        }
    }
};
