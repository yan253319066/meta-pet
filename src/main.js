import './assets/main.css'
import './styles/theme.scss'
import 'vant/lib/index.css'
import '@vant/touch-emulator'

import { createApp } from 'vue'
import {
    ConfigProvider,
    Button,
    Icon,
    Tabbar,
    TabbarItem,
    Swipe,
    SwipeItem,
    Locale,
    Dialog,
    Loading,
    Overlay,
    Popup,
    Tab,
    Tabs,
    ShareSheet,
    ImagePreview,
    List,
    NavBar,
    Field,
    Uploader,
    Picker,
    Search,
    DropdownMenu,
    DropdownItem,
    CellGroup,
    Radio,
    RadioGroup,
    NoticeBar,
    Form
} from 'vant'
import enUS from 'vant/es/locale/lang/en-US'
import zhTW from 'vant/es/locale/lang/zh-TW'
import App from './App.vue'
import router from './router'
import i18n from './i18n'

// 设置 Vant 的语言
Locale.use('en-US', enUS)

const app = createApp(App)

// 注册 Vant 组件
app.use(ConfigProvider)
app.use(Button)
app.use(Icon)
app.use(Tabbar)
app.use(TabbarItem)
app.use(Swipe)
app.use(SwipeItem)
app.use(Dialog)
app.use(Loading)
app.use(Overlay)
app.use(Popup)
app.use(Tabs)
app.use(Tab)
app.use(ShareSheet)
app.use(ImagePreview)
app.use(List)
app.use(NavBar)
app.use(Field)
app.use(Uploader)
app.use(Picker)
app.use(Search)
app.use(DropdownMenu)
app.use(DropdownItem)
app.use(CellGroup)
app.use(Radio)
app.use(RadioGroup)
app.use(NoticeBar)
app.use(Form)
app.use(router)
app.use(i18n)

app.mount('#app')
