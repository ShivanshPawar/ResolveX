import assert from 'node:assert/strict'
import test from 'node:test'
import { createIssueSchema, updateIssueSchema } from './issue.validator.js'

test('createIssueSchema accepts a valid citizen issue', () => {
  const result = createIssueSchema.safeParse({
    body: {
      title: 'Streetlight is not working',
      description: 'The light outside the library has been out for two days.',
      category: 'electricity',
      location: 'Library Road',
      latitude: 12.9716,
      longitude: 77.5946,
    },
  })

  assert.equal(result.success, true)
})

test('createIssueSchema rejects invalid map coordinates', () => {
  const result = createIssueSchema.safeParse({
    body: {
      title: 'Blocked drain',
      description: 'Water is overflowing onto the pavement.',
      category: 'water',
      location: 'Market Road',
      latitude: 95,
      longitude: 200,
    },
  })

  assert.equal(result.success, false)
})

test('issue updates validate statuses and object ids', () => {
  const valid = updateIssueSchema.safeParse({
    body: { status: 'in_progress' },
    params: { id: '507f1f77bcf86cd799439011' },
  })
  const invalid = updateIssueSchema.safeParse({
    body: { status: 'unknown' },
    params: { id: 'not-an-object-id' },
  })

  assert.equal(valid.success, true)
  assert.equal(invalid.success, false)
})
