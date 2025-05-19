import { store, updateStore } from '@/store/appkitStore'
import { signMessage } from '@/services/wallet'
import request from '@/utils/request'
import { AppKit } from '@reown/appkit'

/**
 * 
 * @param {AppKit} modal 
 */
export const initializeSubscribers = (modal) => {

    modal.subscribeProviders(state => {
        updateStore('eip155Provider', state['eip155'])
    })

    modal.subscribeAccount(state => {
        updateStore('accountState', state)
    })

    modal.subscribeNetwork(state => {
        updateStore('networkState', state)
    })

    modal.subscribeState(state => {
        store.appKitState = state
    })

    modal.subscribeEvents(async ({ data }) => {
        const event = data.event
        // console.log(event)
        if (event === 'CONNECT_SUCCESS') {
            // console.log('Connection successful')
            const message = "Welcome to Meta Pet"
            const signature = await signMessage(message)

            let inviteCode = localStorage.getItem("parentInviteCode")
            if (!inviteCode)
                inviteCode = ""

            const res = await request.post("signLogin", {
                signature: signature,
                message: message,
                address: store.accountState.address,
                inviteCode: inviteCode // 添加邀请码参数
            });
            if (res?.data?.token)
                localStorage.setItem("meta-token", res?.data?.token);
            // 触发登录成功事件
            window.dispatchEvent(new CustomEvent('login-success'));
        } else if (event === 'DISCONNECT_SUCCESS') {
            localStorage.removeItem("meta-token")
        }
    })
}