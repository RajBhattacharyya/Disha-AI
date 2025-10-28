import Bottleneck from "bottleneck"
export const limiter = new Bottleneck({
  maxConcurrent: 5,
  minTime: 200, // 5 requests/sec max
})
