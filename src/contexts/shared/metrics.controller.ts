import { Controller, Get } from '@nestjs/common';
import { SkipResponseWrapper } from './decorators/skip-response-wrapper.decorator';

// Background CPU sampler — 1s rolling window, updated every second
let _cachedCpuPercent = 0;
let _lastCpuUsage = process.cpuUsage();
let _lastCpuTime = process.hrtime.bigint();

setInterval(() => {
  const now = process.hrtime.bigint();
  const usage = process.cpuUsage(_lastCpuUsage);
  const elapsedMs = Number(now - _lastCpuTime) / 1_000_000;
  const cpuMs = (usage.user + usage.system) / 1000;
  _cachedCpuPercent = Math.min(100, (cpuMs / elapsedMs) * 100);
  _lastCpuUsage = process.cpuUsage();
  _lastCpuTime = now;
}, 1000);

@SkipResponseWrapper()
@Controller('internal/metrics')
export class MetricsController {
  @Get()
  getMetrics() {
    const mem = process.memoryUsage();
    return {
      cpuPercent: parseFloat(_cachedCpuPercent.toFixed(1)),
      rssMemoryMb: parseFloat((mem.rss / 1_048_576).toFixed(1)),
      heapUsedMb: parseFloat((mem.heapUsed / 1_048_576).toFixed(1)),
      heapTotalMb: parseFloat((mem.heapTotal / 1_048_576).toFixed(1)),
      uptimeSeconds: Math.floor(process.uptime()),
      pid: process.pid,
    };
  }
}
