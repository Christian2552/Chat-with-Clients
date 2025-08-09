// // src/Api.ts (or wherever you placed it in your Vue frontend project)

export async function registerUser(data: {
  firstName: string
  lastName: string
  email: string
  password: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('http://localhost:3001/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || 'Unknown error' }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Network error' }
  }
}

export async function loginUser(data: {
  email: string
  password: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || 'Unknown error' }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Network error' }
  }
}



