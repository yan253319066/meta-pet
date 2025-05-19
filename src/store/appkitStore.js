export const store = {
    /**@type {import("@reown/appkit").UseAppKitAccountReturn} */
    accountState: {},
    /**@type {import("@reown/appkit").UseAppKitNetworkReturn} */
    networkState: {},
    /**@type {import("@reown/appkit").PublicStateControllerState} */
    appKitState: {},
    themeState: { themeMode: 'light', themeVariables: {} },
    events: [],
    walletInfo: {},
    eip155Provider: null
}

export const updateStore = (key, value) => {
    store[key] = value
}