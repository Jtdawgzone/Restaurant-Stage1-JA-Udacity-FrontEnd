if(navigator.serviceWorker) {
    navigator.serviceWorker.register("/sw.js").then((reg) => {
    console.log("Service worker registered");
}).catch((e) => {
    console.log("Couldn't register service worker \n", e);
});
}