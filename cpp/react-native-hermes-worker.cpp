#include "react-native-hermes-worker.h"
#include <iostream>                  // for std::cout
#include <hermes/hermes.h>           // For HermesRuntime
#include <jsi/jsi.h>                 // For JSI utilities
#include <ReactCommon/CallInvoker.h> // For React Native integration
#include <fstream>                   // For reading the bundle file

namespace hermesworker
{
    // Thread management
    static std::thread worker_thread;
    static std::atomic<bool> should_stop{false};

    static std::queue<std::string> work_queue;
    static std::mutex queue_mutex;
    static std::condition_variable queue_condition;

    static std::unique_ptr<facebook::hermes::HermesRuntime> worker_runtime;
    static std::string bundleCode;

    static std::map<std::string, ResultCallback> callbacks;
    static std::mutex callbacks_mutex;

    bool isProcessingThreadRunning() {
        return worker_runtime != nullptr;
    }

    static void processQueueItems() {
        std::cout << "C++: Thread worker function started" << std::endl;

        if (worker_runtime) {
            while (!should_stop)
            {
                std::string item_to_process;

                std::unique_lock<std::mutex> lock(queue_mutex);
                queue_condition.wait(lock, []
                                        { return !work_queue.empty() || should_stop; });

                if (should_stop && work_queue.empty())
                {
                    std::cout << "C++: Worker thread stopping - queue empty" << std::endl;
                    break;
                }

                item_to_process = work_queue.front();
                work_queue.pop();
                
                std::cout << "C++: Processing item: " << item_to_process.substr(0, 100) << "..." << std::endl;

                try {
                    std::cout << "C++: Evaluating JavaScript code..." << std::endl;
                    auto result = worker_runtime->evaluateJavaScript(
                        std::make_unique<facebook::jsi::StringBuffer>(item_to_process),
                        "worker"
                    );

                    std::string processed;
                    if (result.isString()) {
                        std::cout << "C++: Result is a string" << std::endl;
                        processed = result.getString(*worker_runtime).utf8(*worker_runtime);
                    } else if (result.isObject()) {
                        std::cout << "C++: Result is an object" << std::endl;
                        // Handle object result by converting to string
                        auto resultObj = result.asObject(*worker_runtime);
                        if (resultObj.hasProperty(*worker_runtime, "toString")) {
                            std::cout << "C++: Converting object to string using toString()" << std::endl;
                            auto toStringFn = resultObj.getPropertyAsFunction(*worker_runtime, "toString");
                            auto stringResult = toStringFn.call(*worker_runtime);
                            processed = stringResult.getString(*worker_runtime).utf8(*worker_runtime);
                        } else {
                            std::cout << "C++: Object has no toString method" << std::endl;
                            processed = "[Object]";
                        }
                    } else {
                        std::cout << "C++: Result is another type, converting to string" << std::endl;
                        processed = result.toString(*worker_runtime).utf8(*worker_runtime);
                    }

                    std::cout << "C++: Processed result: " << processed.substr(0, 100) << "..." << std::endl;

                    std::lock_guard<std::mutex> callbacks_lock(callbacks_mutex);
                    if (callbacks.find(item_to_process) != callbacks.end()) {
                        callbacks[item_to_process](true, processed);
                        callbacks.erase(item_to_process);
                    }
                    std::cout << "C++: Result stored and notified" << std::endl;
                }
                catch (const std::exception &e) {
                    std::cout << "C++: Error occurred: " << e.what() << std::endl;
                    std::lock_guard<std::mutex> callbacks_lock(callbacks_mutex);
                    if (callbacks.find(item_to_process) != callbacks.end()) {
                        callbacks[item_to_process](false, e.what());
                        callbacks.erase(item_to_process);
                    }
                }
            }
        } else {
            std::cout << "C++: Worker runtime is null" << std::endl;
        }
        
        std::cout << "C++: Thread worker function ended" << std::endl;
    }

    void startProcessingThread(const uint8_t *bytecode, size_t size) {
        std::cout << "C++: Starting processing thread" << std::endl;

        worker_runtime = facebook::hermes::makeHermesRuntime();

        if(bytecode && size > 0) {
            std::cout << "C++: Evaluating Hermes bytecode" << std::endl;
            worker_runtime->evaluateJavaScript(
                std::make_unique<facebook::jsi::StringBuffer>(
                    // We need to pass the bytecode as a buffer
                    std::string(reinterpret_cast<const char *>(bytecode), size)),
                "worker");
        }

        should_stop = false;
        worker_thread = std::thread(processQueueItems);
    }

    void stopProcessingThread() {
        should_stop = true;
        queue_condition.notify_one();

        if (worker_thread.joinable()) {
            worker_thread.join();
        }
        worker_runtime.reset();
    }

    void enqueueItem(const std::string &item, ResultCallback callback) {
        if (!worker_runtime) {
            std::cout << "C++: Error - Worker runtime not initialized" << std::endl;
            throw std::runtime_error("Worker runtime not initialized");
        }

        std::cout << "C++: Enqueueing item: " << item.substr(0, 100) << "..." << std::endl;
        
        std::lock_guard<std::mutex> queue_lock(queue_mutex);
        std::lock_guard<std::mutex> callbacks_lock(callbacks_mutex) ;

        callbacks[item] = callback;
        work_queue.push(item);
        
        std::cout << "C++: Item added to queue, notifying worker" << std::endl;
        queue_condition.notify_one();


    }
}
