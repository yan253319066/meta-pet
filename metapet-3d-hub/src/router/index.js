import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import MarketView from '../views/MarketView.vue';
import PetsView from '../views/PetsView.vue';
import ProfileView from '../views/ProfileView.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/market',
    name: 'Market',
    component: MarketView,
  },
  {
    path: '/pets',
    name: 'Pets',
    component: PetsView,
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfileView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
