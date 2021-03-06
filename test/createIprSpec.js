'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const assert = chai.assert
const nock = require('nock')

const ILP = require('ilp')
const utils = require('../src/utils')
const MockFactory = require('./mocks/mockFactory')
const MockCtx = require('./mocks/mockCtx')
const createIpr = require('../src/controllers/create-ipr')

describe('/createIpr', () => {
  beforeEach(function () {
    this.factory = new MockFactory()
    this.ctx = new MockCtx()
    this.config = {
      ilp_prefix: 'example.red.',
      admin: { username: 'admin' },
      connector: 'http://example.com/accounts/connie',
      secret: Buffer.from('secret'),
      backend_url: 'http://example.com/backend'
    }
    this.ctx.request.body = {
      paymentId: 'be569853-5ef1-4153-bf17-64477a534f5b',
      destinationAmount: '1000',
      destinationAccount: 'http://example.com/accounts/alice',
      expiresAt: new Date(Date.now() + 10000).toISOString()
    }
  })

  it('should throw error without a paymentId', async function () {
    delete this.ctx.request.body.paymentId
    await assert.isRejected(
      createIpr(this.config, this.factory, this.ctx),
      /400.*missing JSON body field paymentId/)
  })

  it('should throw error without an expiresAt', async function () {
    delete this.ctx.request.body.expiresAt
    await assert.isRejected(
      createIpr(this.config, this.factory, this.ctx),
      /400.*missing JSON body field expiresAt/)
  })

  it('should throw error without a destinationAccount', async function () {
    delete this.ctx.request.body.destinationAccount
    await assert.isRejected(
      createIpr(this.config, this.factory, this.ctx),
      /400.*missing JSON body field destinationAccount/)
  })

  it('should throw error without a destinationAmount', async function () {
    delete this.ctx.request.body.destinationAmount
    await assert.isRejected(
      createIpr(this.config, this.factory, this.ctx),
      /400.*missing JSON body field destinationAmount/)
  })

  it('should throw error with invalid destinationAmount', async function () {
    this.ctx.request.body.destinationAmount = 'invalid'
    await assert.isRejected(
      createIpr(this.config, this.factory, this.ctx),
      /400.*destinationAmount \(invalid\) is an invalid decimal amount/)
  })

  it('should throw error with invalid paymentId', async function () {
    this.ctx.request.body.paymentId = '193042342-423523-42432-4324'
    await assert.isRejected(
      createIpr(this.config, this.factory, this.ctx),
      /400.*paymentId \(193042342\-423523\-42432\-4324\) is an invalid uuid/)
  })

  it('should return an IPR with data provided', async function () {
    this.ctx.request.body.data = { foo: 'bar' }
    await createIpr(this.config, this.factory, this.ctx),
    assert.isString(this.ctx.body.ipr)
    console.log(this.ctx.body.ipr.length)
    assert.match(this.ctx.body.ipr, /^[A-Za-z\-_0-9]+$/)
    assert.equal(this.ctx.body.ipr.length, 343)
  })

  it('should return an IPR', async function () {
    await createIpr(this.config, this.factory, this.ctx),
    assert.isString(this.ctx.body.ipr)
    assert.match(this.ctx.body.ipr, /^[A-Za-z\-_0-9]+$/)
    assert.equal(this.ctx.body.ipr.length, 326)
  })
})
