"use client"
import { signout } from "@/apis/auth"
import { Button } from "@/components/ui/button"

const page = () => {
  return (
    <div>
      <Button onClick={() => signout()}>sign out</Button>
    </div>
  )
}

export default page