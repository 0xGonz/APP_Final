# Nix configuration for Replit environment
# Defines system packages and dependencies needed for the application

{ pkgs }: {
  deps = [
    # Node.js runtime (LTS version)
    pkgs.nodejs-18_x

    # PostgreSQL client libraries (required for Prisma)
    pkgs.postgresql

    # Build tools
    pkgs.nodePackages.typescript
    pkgs.nodePackages.typescript-language-server

    # Additional utilities
    pkgs.curl
    pkgs.git
  ];

  # Environment variables
  env = {
    # Set npm config directory to avoid permission issues
    NPM_CONFIG_PREFIX = "/home/runner/.npm-global";

    # Add npm global bin to PATH
    PATH = "/home/runner/.npm-global/bin:${pkgs.nodejs-18_x}/bin";
  };
}
