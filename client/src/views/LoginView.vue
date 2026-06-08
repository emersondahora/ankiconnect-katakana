<template>
  <div class="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-extrabold text-white">
        AnkiConnect Katakana
      </h2>
      <p class="mt-2 text-center text-sm text-gray-400">
        Authentication Required
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-700">
        <div v-if="errorMsg" class="mb-4 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded relative" role="alert">
          <span class="block sm:inline">{{ errorMsg }}</span>
        </div>

        <div class="space-y-6 flex flex-col items-center">
          <GoogleLogin :callback="handleLogin" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiClient } from '../api/client'

const router = useRouter()
const errorMsg = ref('')

const handleLogin = async (response: any) => {
  try {
    errorMsg.value = ''
    const { credential } = response
    
    // Call the backend to verify the token and get our JWT
    const { data } = await apiClient.post('/auth/google', { credential })
    
    if (data.token) {
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      // Redirect to home
      router.push('/')
    }
  } catch (err: any) {
    console.error('Login error:', err)
    if (err.response?.status === 403) {
      errorMsg.value = 'Access Denied: Your email is not authorized.'
    } else {
      errorMsg.value = 'An error occurred during login. Please try again.'
    }
  }
}
</script>
