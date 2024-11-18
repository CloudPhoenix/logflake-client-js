# LogFlake Client JS
## Introduction

**LogFlake Client JS** is a JavaScript client library for interacting with the LogFlake logging platform. It allows you to initialize logging, send logs and exceptions, and measure performance in your applications.

## Installation

Install the package:

```bash
yarn add @logflake/client
```

## Usage

### Initialization

Import the necessary functions and initialize the client with your application ID and server URL:

```javascript
import { initialize } from '@logflake/client';

initialize('YOUR_APP_ID', 'YOUR_SERVER_URL', {
  correlation: () => 'correlation-id', // Optional correlation function or string
  enableCompression: true, // Optional, default is true
  hostname: 'example.com', // Optional, default is window.location.hostname
});
```

### Sending Logs

Send a log message with optional parameters:

```javascript
import { LogLevels, sendLog } from '@logflake/client';

sendLog('Your log message', {
  level: LogLevels.INFO, // Optional log level, default is 'DEBUG'
  correlation: 'correlation-id', // Optional
  hostname: 'example.com', // Optional
  params: { key: 'value' }, // Optional additional parameters
});
```

### Sending Exceptions

Capture and send exceptions to LogFlake:

```javascript
import { sendException } from '@logflake/client';

try {
  // Your code that may throw an error
} catch (error) {
  sendException(error, {
    correlation: 'correlation-id', // Optional
    hostname: 'example.com', // Optional
    params: { key: 'value' }, // Optional additional parameters
  });
}
```

### Measuring Performance

Measure the performance of a code block:

```javascript
import { measurePerformance } from '@logflake/client';

const dispose = measurePerformance('operation-name');

// Your operation code here

dispose()?.then((duration) => {
  console.log(`Operation took ${duration}ms`);
});
```

## Configuration Options

When initializing the client, you can provide the following options:

- `correlation`: A function or value used to generate a correlation ID. Default is `undefined`.
- `enableCompression`: Enables compression of logs. Default is `true`.
- `hostname`: The hostname associated with the logs. Default is `window.location.hostname`.

## Log Levels

The following log levels are available:

- `DEBUG`
- `INFO`
- `WARNING`
- `ERROR`
- `FATAL`
- `EXCEPTION`

Use these levels to categorize your log messages appropriately.

## License

This project is licensed under the MIT License.
