#ifndef HERMESWORKER_H
#define HERMESWORKER_H

#include <queue>
#include <mutex>
#include <condition_variable>
#include <thread>
#include <atomic>
#include <map>
#include <string>

namespace hermesworker
{
  // Add the callback type definition in the header
  using ResultCallback = std::function<void(bool success, const std::string&)>;

  bool isProcessingThreadRunning();
  void startProcessingThread(const uint8_t *bytecode, size_t size);
  void stopProcessingThread();
  void enqueueItem(const std::string &item, ResultCallback callback);
}

#endif /* HERMESWORKER_H */
