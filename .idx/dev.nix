{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-23.11"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages.
  packages = [
    pkgs.nodejs_20      # For using npm/npx locally
    pkgs.docker         # Docker daemon and client
    pkgs.docker-compose # For running docker-compose commands
  ];

  # Sets environment variables in the workspace.
  env = {};

  # To run the application, open a terminal and run `docker compose up`.
  # The web preview will be available on port 9002.
}
