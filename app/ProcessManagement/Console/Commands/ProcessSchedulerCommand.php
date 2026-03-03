<?php

namespace App\ProcessManagement\Console\Commands;

use App\ProcessManagement\Services\Scheduler;
use App\ProcessManagement\Services\Interpreter;
use Illuminate\Console\Command;

class ProcessSchedulerCommand extends Command
{
    protected $signature = 'process:scheduler {--timeout=0 : Timeout in seconds (0 = infinite)}';
    protected $description = 'Run process scheduler loop to execute ready tokens';

    protected Scheduler $scheduler;
    protected int $cycleCount = 0;
    protected int $tokensProcessed = 0;

    public function handle(): int
    {
        $this->scheduler = new Scheduler(new Interpreter());
        $timeout = (int) $this->option('timeout');
        $startTime = time();

        $this->info('🚀 Process Scheduler started');

        while (true) {
            try {
                $processed = $this->scheduler->cycle(limit: 100);
                $this->cycleCount++;
                $this->tokensProcessed += $processed;

                if ($processed > 0) {
                    $this->line("Cycle #{$this->cycleCount}: processed {$processed} tokens");
                }

                // Sleep 100ms before next cycle
                usleep(100000);

                // Check timeout
                if ($timeout > 0 && (time() - $startTime) >= $timeout) {
                    $this->info('⏱️  Timeout reached');
                    break;
                }
            } catch (\Throwable $e) {
                $this->error("Scheduler error: {$e->getMessage()}");
                $this->error($e->getTraceAsString());

                // Continue on error to avoid stopping the scheduler
                sleep(1);
            }
        }

        $this->info("✅ Scheduler stopped. Total cycles: {$this->cycleCount}, tokens processed: {$this->tokensProcessed}");
        return 0;
    }
}
