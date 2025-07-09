{ pkgs, ... }: {
  # Add packages and tools to your environment
  packages = [
    pkgs.nodejs_20 
    pkgs.docker
    pkgs.docker-compose
  ];

  # Enable the Docker daemon service
  services.docker.enable = true;

  # Add your user to the "docker" group to run Docker commands without sudo
  users.users.user.extraGroups = [ "docker" ];
}
