import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/utils/supabaseClient'
import Authentication from '@/pages/Authentication.vue'
import Requests from '@/pages/Requests.vue'
import SupportRequests from '@/pages/SupportRequests.vue'

const routes = [
  { path: '/', component: Authentication },
  { path: '/requests', component: Requests },
  {
    path: '/supportrequests',
    component: SupportRequests,
    meta: { requiresSupport: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresSupport) {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return next('/')
    }

    // Get role from 'profiles' table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (error || !profile || profile.role !== 'support') {
      return next('/') // Redirect non-support users
    }
  }

  next()
})

export default router
