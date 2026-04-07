import { EventCreationForm } from '@/components/forms/event-creation-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create New Event | EventVote',
  description: 'Create a new voting event with customizable nominations, voting options, and pricing.',
}

export default function CreateEventPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Create New Event</h1>
        <p className="text-text-secondary mt-2">
          Set up your event in 4 simple steps. Your progress is automatically saved.
        </p>
      </div>
      
      <EventCreationForm />
    </div>
  )
}