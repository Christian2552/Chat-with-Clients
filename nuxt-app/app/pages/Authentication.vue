<script lang="ts" setup>
import '/assets/Authentication.css'
import { supabase } from '@/utils/supabaseClient'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const isSignUp = ref(false)
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const repeatPassword = ref('')
const errorMessage = ref('')

// Redirect if already logged in
onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    // Get role and redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    const role = profile?.role || 'user'
    if (role === 'support') {
      router.push('/supportrequests')
    } else {
      router.push('/requests')
    }
  }
})

function goToSignUp() {
  isSignUp.value = true
}

function goToSignIn() {
  isSignUp.value = false
}

async function signUpHandler() {
  errorMessage.value = ''

  if (!firstName.value || !lastName.value || !email.value || !password.value || !repeatPassword.value) {
    errorMessage.value = 'All fields are required.'
    return
  }

  if (password.value !== repeatPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
  })

  if (error) {
    errorMessage.value = error.message
    return
  }

  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        first_name: firstName.value,
        last_name: lastName.value,
        email: email.value,
        role: 'user'
      })

    if (profileError) {
      errorMessage.value = profileError.message
      return
    }
  }

  router.push('/requests')
}

async function loginUserHandler() {
  errorMessage.value = ''

  if (!email.value || !password.value) {
    errorMessage.value = 'Email and password are required.'
    return
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  if (error) {
    errorMessage.value = error.message
    return
  }

  const userId = data.user.id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profileError) {
    errorMessage.value = profileError.message
    return
  }

  const role = profile?.role || 'user'
  if (role === 'support') {
    router.push('/supportrequests')
  } else {
    router.push('/requests')
  }
}
</script>

<template>
  <div class="container" :class="{ 'right-panel-active': isSignUp }">
    <!-- Sign Up -->
    <div class="form-container sign-up-container">
      <form @submit.prevent="signUpHandler">
        <h1>Create Account</h1>
        <p v-if="errorMessage" style="color: red;">{{ errorMessage }}</p>
        <input v-model="firstName" type="text" placeholder="First Name" />
        <input v-model="lastName" type="text" placeholder="Last Name" />
        <input v-model="email" type="email" placeholder="Email" />
        <input v-model="password" type="password" placeholder="Password" />
        <input v-model="repeatPassword" type="password" placeholder="Repeat Password" />
        <button type="submit">Sign Up</button>
      </form>
    </div>

    <!-- Sign In -->
    <div class="form-container sign-in-container">
      <form @submit.prevent="loginUserHandler">
        <h1>Sign In</h1>
        <p v-if="errorMessage" style="color: red;">{{ errorMessage }}</p>
        <input v-model.trim="email" type="email" placeholder="Email" />
        <input v-model.trim="password" type="password" placeholder="Password" />
        <button type="submit">Sign In</button>
      </form>
    </div>

    <!-- Overlay -->
    <div class="overlay-container">
      <div class="overlay">
        <div class="overlay-panel overlay-left">
          <h1>Welcome Back</h1>
          <p>To keep connected with us please login with your personal info</p>
          <button class="ghost" @click="goToSignIn">Sign In</button>
        </div>
        <div class="overlay-panel overlay-right">
          <h1>Hello Friend!</h1>
          <p>Enter your personal details and start your journey with us</p>
          <button class="ghost" @click="goToSignUp">Sign Up</button>
        </div>
      </div>
    </div>
  </div>
</template>
