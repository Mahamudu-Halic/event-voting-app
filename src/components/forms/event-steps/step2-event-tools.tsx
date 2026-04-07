'use client'

import { useFormContext } from 'react-hook-form'
import { EventFormData } from '@/lib/validations/event'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Trophy, Users, Settings, Info } from 'lucide-react'

export function Step2EventTools() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<EventFormData>()

  const enableNominations = watch('enableNominations')
  const enableVoting = watch('enableVoting')

  return (
    <Card className="bg-purple-surface border-purple-accent/50">
      <CardHeader>
        <CardTitle className="text-text-primary flex items-center gap-2">
          <Settings className="h-5 w-5 text-gold-primary" />
          Event Tools
        </CardTitle>
        <CardDescription className="text-text-secondary">
          Choose which features you want to enable for your event.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nominations */}
        <div className="flex items-start justify-between p-4 rounded-lg border border-purple-accent/30 bg-purple-bg/50">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-accent/20 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-purple-accent" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-text-primary">Nominations</h3>
                <Badge variant="outline" className="border-warning text-warning text-xs">
                  Popular
                </Badge>
              </div>
              <p className="text-sm text-text-secondary">
                Allow users to nominate candidates for awards or recognition. 
                You can set up categories and review nominations before they go live.
              </p>
            </div>
          </div>
          <Switch
            checked={enableNominations}
            onCheckedChange={(checked) => setValue('enableNominations', checked)}
            className="data-[state=checked]:bg-gold-primary"
          />
        </div>

        {/* Voting */}
        <div className="flex items-start justify-between p-4 rounded-lg border border-purple-accent/30 bg-purple-bg/50">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-accent/20 flex items-center justify-center shrink-0">
              <Trophy className="h-5 w-5 text-purple-accent" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-text-primary">Voting</h3>
                <Badge className="bg-success text-text-tertiary text-xs">
                  Required
                </Badge>
              </div>
              <p className="text-sm text-text-secondary">
                Enable paid voting for your event. Users can purchase votes to support 
                their favorite nominees. This generates revenue for your event.
              </p>
            </div>
          </div>
          <Switch
            checked={enableVoting}
            onCheckedChange={(checked) => setValue('enableVoting', checked)}
            className="data-[state=checked]:bg-gold-primary"
            disabled
          />
        </div>

        {/* Info Box */}
        <div className="flex gap-3 p-4 rounded-lg bg-gold-primary/10 border border-gold-primary/30">
          <Info className="h-5 w-5 text-gold-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-text-primary">Need help deciding?</p>
            <p className="text-sm text-text-secondary">
              For most events, we recommend enabling both nominations and voting. 
              Nominations help you discover the best candidates, while voting generates 
              revenue and engagement.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
