# LunaCycle

## Running in Production with PM2

This project uses [PM2](https://pm2.keymetrics.io/) to manage the running process in a production-like environment.

1.  **Install PM2 globally** (if you haven't already):
    ```bash
    pnpm add -g pm2
    ```

2.  **Build the server executable:**

    This command compiles the TypeScript server into a single, standalone executable. This is ideal for low-powered environments as it minimizes runtime overhead.
    ```bash
    pnpm run build:server
    ```

3.  **Start the application using PM2:**

    This project includes an `ecosystem.config.js` file that is configured to run the compiled server executable.
    ```bash
    pm2 start ecosystem.config.js
    ```

4.  **(Optional) Configure PM2 to start on system boot:**
    ```bash
    pm2 startup
    ```
    Follow the instructions output by the command.
