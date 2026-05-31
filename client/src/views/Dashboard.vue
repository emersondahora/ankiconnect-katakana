<script setup lang="ts">
import StatusCard from '../components/dashboard/StatusCard.vue'
import QuickActionsCard from '../components/dashboard/QuickActionsCard.vue'
import DeckListCard from '../components/dashboard/DeckListCard.vue'
</script>

<template>
  <div class="p-8 h-full overflow-y-auto">
    <header class="mb-8">
      <h2 class="text-3xl font-bold text-white">Welcome back!</h2>
      <p class="text-slate-400 mt-2">Ready to create some beautiful Anki cards today?</p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

      <!-- Left Column: Status & Actions -->
      <div class="lg:col-span-1 space-y-6">
        <StatusCard />
        <QuickActionsCard />
      </div>

      <!-- Right Column: Decks -->
      <div class="lg:col-span-2">
        <DeckListCard />
      </div>

    </div>
  </div>
</template>
