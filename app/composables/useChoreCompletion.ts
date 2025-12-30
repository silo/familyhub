// Composable for chore completion with celebration and undo functionality
import type { ChoreCompletion } from '~/types'

interface CompletionResult {
  completion: ChoreCompletion
  pointsEarned: number
  choreName: string
  completedByName: string
}

export function useChoreCompletion() {
  const toast = useToast()
  const showCelebration = ref(false)
  const lastCompletion = ref<CompletionResult | null>(null)

  async function completeChore(choreId: number, familyMemberId: number) {
    try {
      const response = await $fetch<{
        data?: CompletionResult
        error?: string
      }>(`/api/chores/${choreId}/complete`, {
        method: 'POST',
        body: { completedBy: familyMemberId },
      })

      // Check for error response
      if (response.error || !response.data) {
        toast.add({
          title: 'Cannot complete',
          description: response.error || 'Failed to complete chore',
          icon: 'i-heroicons-exclamation-circle',
          color: 'warning',
          duration: 3000,
        })
        return null
      }

      lastCompletion.value = response.data
      showCelebration.value = true

      // Show toast with undo button (5 second window)
      toast.add({
        id: `completion-${response.data.completion.id}`,
        title: 'Chore completed!',
        description: `${response.data.completedByName} earned ${response.data.pointsEarned} points`,
        icon: 'i-heroicons-check-circle',
        color: 'success',
        duration: 5000,
        actions: [
          {
            label: 'Undo',
            color: 'neutral',
            variant: 'outline',
            onClick: async () => {
              await undoCompletion(response.data!.completion.id)
            },
          },
        ],
      })

      return response.data
    } catch (error: unknown) {
      const err = error as { data?: { error?: string }; message?: string }
      toast.add({
        title: 'Error',
        description: err.data?.error || err.message || 'Failed to complete chore',
        icon: 'i-heroicons-exclamation-circle',
        color: 'error',
        duration: 3000,
      })
      return null
    }
  }

  async function undoCompletion(completionId: number) {
    try {
      await $fetch(`/api/chores/completions/${completionId}/undo`, {
        method: 'POST',
      })

      toast.remove(`completion-${completionId}`)
      toast.add({
        title: 'Undone',
        description: 'Chore completion has been reversed',
        icon: 'i-heroicons-arrow-uturn-left',
        color: 'neutral',
        duration: 2000,
      })

      lastCompletion.value = null
      return true
    } catch (error: unknown) {
      const err = error as { data?: { message?: string }; message?: string }
      toast.add({
        title: 'Cannot undo',
        description: err.data?.message || 'Undo window has expired',
        icon: 'i-heroicons-exclamation-circle',
        color: 'warning',
        duration: 3000,
      })
      return false
    }
  }

  function onCelebrationComplete() {
    showCelebration.value = false
  }

  return {
    showCelebration,
    lastCompletion,
    completeChore,
    undoCompletion,
    onCelebrationComplete,
  }
}
