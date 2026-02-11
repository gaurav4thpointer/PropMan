import { test, expect } from '@playwright/test'

test.describe('Lease creation with inline tenant', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // If redirected to login or on the public landing page, navigate to login and fill credentials
    const url = page.url()
    if (url.includes('/login')) {
      await page.getByPlaceholder('you@example.com').fill('owner@example.com')
      await page.getByPlaceholder('••••••••').fill('password123')
      await page.getByRole('button', { name: 'Sign in' }).click()
      await page.waitForURL(/\/(dashboard|properties|tenants|leases)?\/?$/, { timeout: 10000 })
    } else {
      // On Landing page (unauthenticated home), click Log in then authenticate
      const loginLink = page.getByRole('link', { name: /log in/i })
      if (await loginLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await loginLink.click()
        await page.getByPlaceholder('you@example.com').fill('owner@example.com')
        await page.getByPlaceholder('••••••••').fill('password123')
        await page.getByRole('button', { name: 'Sign in' }).click()
        await page.waitForURL(/\/(dashboard|properties|tenants|leases)?\/?$/, { timeout: 10000 })
      }
    }
  })

  test('Create lease with inline tenant: + Add new tenant works, tenant form appears, save closes form and selects tenant, lease creates successfully', async ({ page }) => {
    // 1. Navigate to Leases page
    await page.goto('/leases')
    await expect(page).toHaveURL(/\/leases/)

    // 2. Click "+ Create lease"
    await page.getByRole('button', { name: '+ Create lease' }).click()

    // 3. Select a property (first combobox is Property)
    const propertySelect = page.locator('select').first()
    await propertySelect.selectOption({ index: 1 }) // First real property

    // 4. Tenant section: click "+ Add new tenant"
    const addTenantBtn = page.getByRole('button', { name: '+ Add new tenant' })
    await expect(addTenantBtn).toBeVisible()
    await addTenantBtn.click()

    // 5. Verify inline tenant form appears (New tenant heading)
    const tenantFormHeading = page.getByRole('heading', { name: 'New tenant' })
    await expect(tenantFormHeading).toBeVisible({ timeout: 3000 })

    // Tenant form is in a div with the heading - get the form within that section
    const tenantFormSection = page.locator('div').filter({ has: tenantFormHeading })
    const tenantForm = tenantFormSection.locator('form')

    await tenantForm.locator('input[name="name"]').fill('Test Tenant Inline')
    await tenantForm.locator('input[name="phone"]').fill('+1234567890')
    await tenantForm.locator('input[name="email"]').fill('test.inline@example.com')

    // 6. Click Save on tenant form
    await tenantForm.getByRole('button', { name: 'Save' }).click()

    // 7. Wait for tenant form to close
    await expect(tenantFormHeading).not.toBeVisible({ timeout: 5000 })

    // 8. Verify tenant dropdown includes new tenant and is selected
    const tenantSelect = page.locator('select').nth(1) // Second select is Tenant
    await expect(tenantSelect).toContainText('Test Tenant Inline')
    await expect(tenantSelect).toHaveValue(/.+/) // Some value selected

    // 9. Fill lease form: start date, end date, installment amount
    await page.getByLabel(/start date/i).fill('2025-02-01')
    await page.getByLabel(/end date/i).fill('2026-01-31')
    await page.getByLabel(/installment amount/i).fill('5000')

    // 10. Click Create lease
    await page.getByRole('button', { name: 'Create lease' }).click()

    // 11. Verify lease form closes and list shows new lease
    await expect(page.getByRole('heading', { name: 'New lease' })).not.toBeVisible({ timeout: 5000 })

    // 12. Verify lease appears in list
    await expect(page.locator('text=Test Tenant Inline')).toBeVisible({ timeout: 5000 })
  })
})
