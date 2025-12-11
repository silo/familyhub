<script setup lang="ts">
// Celebration animation with confetti/party effect
// Triggered when a chore is completed

const props = defineProps<{
  show: boolean
  duration?: number
}>()

const emit = defineEmits<{
  complete: []
}>()

const isVisible = ref(false)
const particles = ref<Array<{
  id: number
  x: number
  y: number
  color: string
  size: number
  rotation: number
  velocityX: number
  velocityY: number
}>>([])

const confettiColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
]

function createParticles() {
  const newParticles = []
  for (let i = 0; i < 50; i++) {
    newParticles.push({
      id: i,
      x: 50 + (Math.random() - 0.5) * 20,
      y: 50,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)]!,
      size: 8 + Math.random() * 8,
      rotation: Math.random() * 360,
      velocityX: (Math.random() - 0.5) * 15,
      velocityY: -10 - Math.random() * 15
    })
  }
  particles.value = newParticles
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    isVisible.value = true
    createParticles()
    
    // Auto-hide after duration
    setTimeout(() => {
      isVisible.value = false
      emit('complete')
    }, props.duration || 2000)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="celebration">
      <div 
        v-if="isVisible" 
        class="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      >
        <!-- Confetti particles -->
        <div
          v-for="particle in particles"
          :key="particle.id"
          class="absolute confetti-particle"
          :style="{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            transform: `rotate(${particle.rotation}deg)`,
            '--velocity-x': particle.velocityX,
            '--velocity-y': particle.velocityY
          }"
        />
        
        <!-- Center burst effect -->
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="celebration-burst">
            <span class="text-6xl">🎉</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confetti-particle {
  border-radius: 2px;
  animation: confetti-fall 2s ease-out forwards;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: 
      translateX(calc(var(--velocity-x) * 30px)) 
      translateY(calc(100vh + var(--velocity-y) * -30px)) 
      rotate(720deg);
    opacity: 0;
  }
}

.celebration-burst {
  animation: burst 0.5s ease-out forwards;
}

@keyframes burst {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.5);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

.celebration-enter-active {
  transition: opacity 0.2s ease-out;
}

.celebration-leave-active {
  transition: opacity 0.5s ease-out;
}

.celebration-enter-from,
.celebration-leave-to {
  opacity: 0;
}
</style>
