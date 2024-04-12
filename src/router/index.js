import { createRouter, createWebHistory } from 'vue-router'
import EventsView from '../views/EventsView.vue'
import QuarantineView from '../views/QuarantineView.vue'
// create async configureRouter
export async function configureRouter(idsrvAuth) {
  const routes = [
    {
      path: '/',
      name: 'home',
      component: QuarantineView,
      meta: { authName: idsrvAuth.authName },
    },
    {
      path: '/Events',
      name: 'events',
      component: EventsView,
      meta: { authName: idsrvAuth.authName },
    },
    {
      path: '/Quarantine',
      name: 'quarantine',
      component: QuarantineView,
      meta: { authName: idsrvAuth.authName },
    },
    {
      path: '/Quarantine/:id/:seq',
      name: 'QuarantineWithSeqId',
      meta: { authName: idsrvAuth.authName },
      props: true,
      component: () => import(/* webpackChunkName: "about" */ '../views/QuarantineMessageView.vue')
    },
    {
      path: '/Quarantine/:id',
      name: 'QuarantineWithId',
      meta: { authName: idsrvAuth.authName },
      props: true,
      component: () => import(/* webpackChunkName: "about" */ '../views/QuarantineMessageView.vue')
    },
    {
      path: '/Configs',
      name: 'Configs',
      meta: { authName: idsrvAuth.authName },
      component: () => import(/* webpackChunkName: "about" */ '../views/ConfigsView.vue')
    },
    {
      path: '/Config',
      name: 'Config',
      meta: { authName: idsrvAuth.authName },
      component: () => import(/* webpackChunkName: "about" */ '../views/ConfigView.vue')
    },
    {
      path: '/Config/:id',
      name: 'ConfigWithId',
      meta: { authName: idsrvAuth.authName },
      props: true,
      component: () => import(/* webpackChunkName: "about" */ '../views/ConfigView.vue')
    },
    {
      path: '/Domains',
      name: 'Domains',
      meta: { authName: idsrvAuth.authName },
      component: () => import(/* webpackChunkName: "about" */ '../views/DomainsView.vue')
    },
    {
      path: '/Config',
      name: 'Domain',
      meta: { authName: idsrvAuth.authName },
      component: () => import(/* webpackChunkName: "about" */ '../views/DomainView.vue')
    },
    {
      path: '/Config/:id',
      name: 'DomainWithId',
      meta: { authName: idsrvAuth.authName },
      props: true,
      component: () => import(/* webpackChunkName: "about" */ '../views/DomainView.vue')
    },
    
  ]

  const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
  })
  return router;
}
export default configureRouter
