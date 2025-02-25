export const config = {
  server: {
    basePort: 3000,
    fallbackPorts: [3001, 3002, 3003],
    get currentPort(): number {
      // This will be set by the server when it starts
      return this._currentPort || this.basePort;
    },
    set currentPort(port: number) {
      this._currentPort = port;
    },
    _currentPort: 0
  }
}; 