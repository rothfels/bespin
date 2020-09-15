import { handleHttpReq, handler, handleServiceReq } from './handler'
import { LambdaFunc } from './protocol'

describe('handler', () => {
  it('should handle service req', async () => {
    ;(handleServiceReq as any) = jest.fn().mockReturnValue(Promise.resolve())
    expect(
      await handler(
        {
          function: LambdaFunc.PING,
        },
        {}
      )
    ).toBeUndefined()
    expect(handleServiceReq).toHaveBeenCalled()
  })
  it('should handle http req', async () => {
    ;(handleHttpReq as any) = jest.fn().mockReturnValue(Promise.resolve())
    expect(
      await handler(
        {
          resource: 'test',
        },
        {}
      )
    ).toBeUndefined()
    expect(handleHttpReq).toHaveBeenCalled()
  })
  it('should throw an error if not a serviceReq or httpReq', async () => {
    await expect(handler({}, {})).rejects.toThrow('unexpected req, not ServiceReq or HttpReq')
  })
})
