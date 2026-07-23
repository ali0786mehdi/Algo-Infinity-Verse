let activeModule = 0;
let activeLesson = 0;
let userProgress;
try {
  userProgress = JSON.parse(localStorage.getItem('dockerK8sProgress'));
} catch (e) {
  userProgress = null;
}
if (!userProgress || typeof userProgress !== 'object' || !Array.isArray(userProgress.completedLessons)) {
  userProgress = { completedLessons: [], completedQuizzes: [] };
}

const curriculum = [
  {
    id: 'mod-1',
    title: 'Docker Fundamentals',
    icon: 'fa-docker',
    lessons: [
      {
        id: 'm1-l1',
        title: 'Introduction to Docker',
        content: `
          <div class="lesson-prose">
            <div class="learning-objectives">
              <h4><i class="fas fa-bullseye"></i> Learning Objectives</h4>
              <ul>
                <li>Understand what Docker is and why it revolutionized software delivery</li>
                <li>Differentiate between containers and virtual machines</li>
                <li>Identify the core components of the Docker ecosystem</li>
              </ul>
            </div>
            <h2>What is Docker?</h2>
            <p>Docker is an open platform for developing, shipping, and running applications. It enables you to separate your applications from your infrastructure so you can deliver software quickly. By packaging applications into <strong>containers</strong>, Docker ensures they run the same way regardless of where they are deployed.</p>
            <h3>The "Works on My Machine" Problem</h3>
            <p>Before Docker, developers frequently encountered environment inconsistencies — an app ran perfectly on a developer's laptop but failed in testing or production due to differing dependencies, OS versions, or configurations. Docker solves this by bundling the application with all its dependencies into a single portable container image.</p>
            <h3>Containers vs Virtual Machines</h3>
            <table class="comparison-table">
              <tr><th>Aspect</th><th>Containers</th><th>Virtual Machines</th></tr>
              <tr><td>Operating System</td><td>Share the host OS kernel</td><td>Each VM runs a full guest OS</td></tr>
              <tr><td>Startup Time</td><td>Milliseconds</td><td>Minutes</td></tr>
              <tr><td>Size</td><td>Megabytes (MB)</td><td>Gigabytes (GB)</td></tr>
              <tr><td>Resource Overhead</td><td>Minimal — only the app and its dependencies</td><td>Significant — full OS per VM</td></tr>
              <tr><td>Isolation Level</td><td>Process-level (namespace cgroups)</td><td>Hypervisor-level (hardware virtualization)</td></tr>
            </table>
            <h3>The Docker Ecosystem</h3>
            <p>Docker is more than just a single tool. The ecosystem includes:</p>
            <ul>
              <li><strong>Docker Engine:</strong> The core runtime that builds and runs containers (daemon + CLI).</li>
              <li><strong>Docker Images:</strong> Read-only templates used to create containers.</li>
              <li><strong>Docker Containers:</strong> Runnable instances of images, isolated yet lightweight.</li>
              <li><strong>Docker Hub:</strong> A cloud-based registry for storing and sharing images.</li>
              <li><strong>Docker Compose:</strong> A tool for defining and running multi-container applications.</li>
            </ul>
            <h3>Basic Docker Workflow</h3>
            <ol>
              <li>Write a <code>Dockerfile</code> describing your application and its dependencies.</li>
              <li>Build an image using <code>docker build</code>.</li>
              <li>Run a container from that image with <code>docker run</code>.</li>
              <li>Share the image via a registry using <code>docker push</code>.</li>
              <li>Pull and run the image anywhere with <code>docker pull</code> and <code>docker run</code>.</li>
            </ol>
            <div class="summary-takeaways">
              <h4><i class="fas fa-check-circle"></i> Key Takeaways</h4>
              <ul>
                <li>Docker packages applications with all dependencies into portable containers</li>
                <li>Containers share the host OS kernel, making them far more lightweight than VMs</li>
                <li>The Docker ecosystem includes Engine, Images, Containers, Hub, and Compose</li>
                <li>Docker eliminates environment inconsistencies across development, testing, and production</li>
              </ul>
            </div>
          </div>
        `,
      },
      {
        id: 'm1-l2',
        title: 'Images & Containers Deep Dive',
        content: `
          <div class="lesson-prose">
            <div class="learning-objectives">
              <h4><i class="fas fa-bullseye"></i> Learning Objectives</h4>
              <ul>
                <li>Understand the image layer architecture and how UnionFS works</li>
                <li>Master container lifecycle management with Docker CLI commands</li>
                <li>Differentiate between image tags, layers, and container states</li>
              </ul>
            </div>
            <h2>Docker Images: Layered Architecture</h2>
            <p>A Docker image is a <strong>read-only template</strong> composed of multiple layers stacked on top of each other. Each layer represents a set of filesystem changes — adding a file, installing a package, or setting an environment variable.</p>
            <h3>Union File System (UnionFS)</h3>
            <p>Docker uses UnionFS to combine these layers into a single coherent filesystem. Because layers are shared and cached, building images becomes incredibly efficient. If two images share the same base Ubuntu layer, Docker only stores it once on disk.</p>
            <pre><code># Example: A typical Node.js image layers
FROM node:18-alpine          # Layer 1: Base OS (~5 MB)
WORKDIR /app                 # Layer 2: Working directory
COPY package*.json ./        # Layer 3: Dependency manifest
RUN npm install              # Layer 4: Installed dependencies
COPY . .                     # Layer 5: Application source
CMD ["node", "server.js"]    # Layer 6: Startup command</code></pre>
            <h3>Container Lifecycle</h3>
            <p>A container is a <strong>runnable instance</strong> of an image. When you run a container, Docker adds a thin writable layer on top of the image's read-only layers. This is where runtime changes happen:</p>
            <ul>
              <li><strong>Created:</strong> Container exists but is not running (<code>docker create</code>).</li>
              <li><strong>Running:</strong> Container is actively executing its process (<code>docker start</code> / <code>docker run</code>).</li>
              <li><strong>Paused:</strong> Process is suspended (<code>docker pause</code>).</li>
              <li><strong>Stopped:</strong> Process has exited (<code>docker stop</code>).</li>
              <li><strong>Deleted:</strong> Container and its writable layer are removed (<code>docker rm</code>).</li>
            </ul>
            <h3>Essential CLI Commands</h3>
            <pre><code>docker pull node:18-alpine    # Download an image
docker images                 # List local images
docker run -d -p 3000:3000 myapp  # Run container in detached mode
docker ps                     # List running containers
docker ps -a                  # List all containers (including stopped)
docker exec -it container_id sh  # Open a shell inside a running container
docker logs container_id      # View container logs
docker rm container_id        # Remove a stopped container
docker rmi image_id           # Remove an image</code></pre>
            <div class="summary-takeaways">
              <h4><i class="fas fa-check-circle"></i> Key Takeaways</h4>
              <ul>
                <li>Images are built from read-only layers using UnionFS for efficient storage</li>
                <li>Containers add a thin writable layer on top of the image layers</li>
                <li>Understanding the container lifecycle (created, running, paused, stopped, deleted) is crucial for debugging</li>
                <li>CLI commands like <code>docker ps</code>, <code>docker exec</code>, and <code>docker logs</code> are essential daily tools</li>
              </ul>
            </div>
          </div>
        `,
      },
      {
        id: 'm1-l3',
        title: 'Dockerfile Best Practices & Multi-stage Builds',
        content: `
          <div class="lesson-prose">
            <div class="learning-objectives">
              <h4><i class="fas fa-bullseye"></i> Learning Objectives</h4>
              <ul>
                <li>Write efficient, secure Dockerfiles following industry best practices</li>
                <li>Understand and implement multi-stage builds to minimize image size</li>
                <li>Leverage layer caching to speed up builds in CI/CD pipelines</li>
              </ul>
            </div>
            <h2>Writing Efficient Dockerfiles</h2>
            <p>A Dockerfile is a text document containing all the commands to assemble an image. Following best practices ensures images are <strong>small</strong>, <strong>secure</strong>, and <strong>fast to build</strong>.</p>
            <h3>Layer Caching</h3>
            <p>Docker caches each layer after it is built. On subsequent builds, if a layer's instructions and context haven't changed, Docker reuses the cached layer. This makes build times dramatically faster — especially in CI/CD pipelines.</p>
            <pre><code># GOOD: Copy package manifests before source code
COPY package*.json ./
RUN npm install          # Cached unless package.json changes
COPY . .                 # Changes frequently – placed last

# BAD: Copy everything first
COPY . .                 # Invalidates cache for ALL subsequent layers
RUN npm install          # Runs on every build — slow!</code></pre>
            <h3>Best Practices Checklist</h3>
            <ul>
              <li><strong>Use specific base images:</strong> Prefer <code>node:18-alpine</code> over <code>node:latest</code> for reproducibility.</li>
              <li><strong>Minimize the number of layers:</strong> Combine RUN commands with <code>&&</code> to reduce layers.</li>
              <li><strong>Use <code>.dockerignore</code>:</strong> Exclude node_modules, .git, and other unnecessary files from the build context.</li>
              <li><strong>Run as non-root:</strong> Add a <code>USER</code> directive to improve security.</li>
              <li><strong>Use <code>COPY --chown</code>:</strong> Explicitly set file ownership rather than relying on defaults.</li>
              <li><strong>Prefer <code>COPY</code> over <code>ADD</code>:</strong> COPY is more transparent; ADD has automatic tar extraction and URL behavior that can be surprising.</li>
            </ul>
            <h3>Multi-stage Builds</h3>
            <p>Multi-stage builds use multiple <code>FROM</code> statements in a single Dockerfile. The key idea: use a heavy <strong>build stage</strong> with all compilers and SDKs, then copy only the compiled artifacts to a <strong>lightweight production stage</strong>.</p>
            <pre><code># Stage 1: Build
FROM golang:1.21 AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o server .

# Stage 2: Production
FROM alpine:3.19
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/server .
USER 1000:1000
EXPOSE 8080
CMD ["./server"]</code></pre>
            <p>Multi-stage builds routinely reduce image sizes by <strong>10x or more</strong> — a Go application that requires 1.5 GB of build tools produces a final image of only ~15 MB.</p>
            <div class="summary-takeaways">
              <h4><i class="fas fa-check-circle"></i> Key Takeaways</h4>
              <ul>
                <li>Order Dockerfile instructions from least to most frequently changing to maximize layer caching</li>
                <li>Multi-stage builds separate build-time dependencies from runtime artifacts</li>
                <li>A well-written Dockerfile produces smaller, faster-to-build, and more secure images</li>
                <li>Always use <code>.dockerignore</code> and run as a non-root user</li>
              </ul>
            </div>
          </div>
        `,
      },
    ],
    quiz: [
      {
        id: 'q1',
        question: 'What is the main advantage containers have over virtual machines?',
        options: [
          'They run a full guest OS for stronger isolation',
          'They share the host OS kernel, making them lightweight and fast to start',
          'They require a hypervisor to run',
          'They are always larger than VM images',
        ],
        correct: 1,
      },
      {
        id: 'q2',
        question: 'What is a Docker image?',
        options: [
          'A running instance of a container',
          'A live snapshot of a running process',
          'A read-only template with instructions for creating a container',
          'A Kubernetes configuration file',
        ],
        correct: 2,
      },
      {
        id: 'q3',
        question: 'Which Dockerfile instruction order maximizes layer caching efficiency?',
        options: [
          'Copy all files first, then install dependencies',
          'Install dependencies first, then copy application source code',
          'Copy package manifests, install dependencies, then copy source code',
          'Use a single RUN command for everything',
        ],
        correct: 2,
      },
      {
        id: 'q4',
        question: 'What is the primary benefit of multi-stage builds?',
        options: [
          'Faster network transfer speeds',
          'Smaller final image size by excluding build-time dependencies',
          'Automatic deployment to Kubernetes',
          'Built-in load balancing',
        ],
        correct: 1,
      },
    ],
  },
  {
    id: 'mod-2',
    title: 'Docker in Practice',
    icon: 'fa-cogs',
    lessons: [
      {
        id: 'm2-l1',
        title: 'Docker Compose & Multi-Container Apps',
        content: `
          <div class="lesson-prose">
            <div class="learning-objectives">
              <h4><i class="fas fa-bullseye"></i> Learning Objectives</h4>
              <ul>
                <li>Define multi-container applications using docker-compose.yml</li>
                <li>Manage service dependencies, environment variables, and ports with Compose</li>
                <li>Use Compose CLI commands for local development workflows</li>
              </ul>
            </div>
            <h2>Why Docker Compose?</h2>
            <p>Modern applications rarely consist of a single container. A typical web app might need a frontend container, a backend API container, a database, a cache (Redis), and a message queue. Running each with individual <code>docker run</code> commands is tedious and error-prone. <strong>Docker Compose</strong> solves this by letting you define all services in a single YAML file.</p>
            <h3>docker-compose.yml Structure</h3>
            <pre><code>version: "3.9"
services:
  api:
    build: ./api
    ports:
      - "3000:3000"
    depends_on:
      - db
      - redis
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/app

  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: pass

  redis:
    image: redis:7-alpine

volumes:
  pgdata:</code></pre>
            <h3>Core Concepts</h3>
            <ul>
              <li><strong>Services:</strong> The containers that make up your application. Each service can specify its image, build context, ports, volumes, and environment variables.</li>
              <li><strong>Networks:</strong> By default, Compose creates a dedicated network for your app. Services can discover each other by service name (e.g., the API can reach <code>db:5432</code>).</li>
              <li><strong>Volumes:</strong> Persistent storage defined at the top level and mounted into services.</li>
              <li><strong>depends_on:</strong> Controls the startup order — but only waits for the container to start, not for the service inside to be ready.</li>
            </ul>
            <h3>Essential Compose CLI Commands</h3>
            <pre><code>docker compose up -d          # Start all services in detached mode
docker compose down           # Stop and remove all containers and networks
docker compose logs -f        # Follow logs from all services
docker compose ps             # List container status for all services
docker compose exec api sh    # Open a shell inside the api service
docker compose build          # Rebuild all images
docker compose up -d --build  # Rebuild and restart</code></pre>
            <div class="summary-takeaways">
              <h4><i class="fas fa-check-circle"></i> Key Takeaways</h4>
              <ul>
                <li>Docker Compose defines multi-container apps in a declarative YAML file</li>
                <li>Services automatically discover each other by name on the default network</li>
                <li><code>docker compose up / down / logs / ps</code> covers most daily development workflows</li>
                <li>Always wait for service readiness (use health checks or entrypoint scripts), not just container startup</li>
              </ul>
            </div>
          </div>
        `,
      },
      {
        id: 'm2-l2',
        title: 'Networking & Volumes',
        content: `
          <div class="lesson-prose">
            <div class="learning-objectives">
              <h4><i class="fas fa-bullseye"></i> Learning Objectives</h4>
              <ul>
                <li>Understand Docker's networking model and driver types</li>
                <li>Create and manage Docker volumes for persistent data</li>
                <li>Configure container-to-container and host-to-container communication</li>
              </ul>
            </div>
            <h2>Docker Networking</h2>
            <p>Docker's networking model enables containers to communicate with each other and with the outside world. Docker provides several built-in network drivers:</p>
            <ul>
              <li><strong>bridge (default):</strong> Creates a private internal network on the host. Containers on the same bridge can communicate. Ports are exposed via <code>-p host:container</code>.</li>
              <li><strong>host:</strong> Removes network isolation. The container shares the host's network stack directly. Best for performance-critical workloads.</li>
              <li><strong>overlay:</strong> Connects containers across multiple Docker hosts (used in Docker Swarm). Containers on different machines can communicate as if on the same network.</li>
              <li><strong>macvlan:</strong> Assigns a MAC address to each container, making them appear as physical devices on the network.</li>
              <li><strong>none:</strong> Disables all networking for the container.</li>
            </ul>
            <h3>Docker Volumes</h3>
            <p>Containers are ephemeral by nature — when a container is removed, all data written to its writable layer is lost. <strong>Volumes</strong> are the preferred mechanism for persisting data generated by containers.</p>
            <pre><code>docker volume create mydata       # Create a named volume
docker run -v mydata:/data app    # Mount a volume into a container
docker volume ls                  # List all volumes
docker volume inspect mydata      # View volume details</code></pre>
            <h3>Bind Mounts vs Volumes</h3>
            <table class="comparison-table">
              <tr><th>Feature</th><th>Named Volumes</th><th>Bind Mounts</th></tr>
              <tr><td>Managed by Docker</td><td>Yes</td><td>No (host path managed by user)</td></tr>
              <tr><td>Backup / Restore</td><td>Easy (<code>docker run --volumes-from</code>)</td><td>Manual</td></tr>
              <tr><td>Use Case</td><td>Database persistence, production data</td><td>Development hot-reload, sharing source code</td></tr>
              <tr><td>Cross-platform</td><td>Works anywhere</td><td>Path-dependent (Linux vs macOS vs Windows)</td></tr>
            </table>
            <pre><code># Bind mount for development (live code reload)
docker run -v $(pwd):/app -w /app node:18 node server.js

# Named volume for production data
docker run -v pgdata:/var/lib/postgresql/data postgres:16</code></pre>
            <div class="summary-takeaways">
              <h4><i class="fas fa-check-circle"></i> Key Takeaways</h4>
              <ul>
                <li>Bridge is the default network driver; use host for performance, overlay for multi-host setups</li>
                <li>Named volumes are managed by Docker and are the best choice for production persistent data</li>
                <li>Bind mounts are ideal for development because they reflect host filesystem changes instantly</li>
                <li>Use <code>docker network</code> and <code>docker volume</code> commands to inspect and manage these resources</li>
              </ul>
            </div>
          </div>
        `,
      },
      {
        id: 'm2-l3',
        title: 'Docker Hub & Registries',
        content: `
          <div class="lesson-prose">
            <div class="learning-objectives">
              <h4><i class="fas fa-bullseye"></i> Learning Objectives</h4>
              <ul>
                <li>Understand the role of container registries in the Docker workflow</li>
                <li>Push and pull images to and from Docker Hub</li>
                <li>Configure private registries and understand image tagging conventions</li>
              </ul>
            </div>
            <h2>Container Registries</h2>
            <p>A <strong>container registry</strong> is a storage and distribution system for Docker images. Think of it as GitHub for container images — you can pull public images, push your own, and control access to private ones.</p>
            <h3>Docker Hub</h3>
            <p><strong>Docker Hub</strong> is the default public registry that Docker CLI communicates with. It hosts millions of official images for popular software: Node.js, Python, PostgreSQL, Redis, Nginx, and many more.</p>
            <pre><code># Pulling an official image
docker pull nginx:latest

# Tagging an image for your repository
docker tag myapp:latest username/myapp:v1.0

# Pushing to Docker Hub
docker push username/myapp:v1.0</code></pre>
            <h3>Image Tagging Conventions</h3>
            <p>Tags identify image versions. Semantic versioning is strongly recommended:</p>
            <pre><code>username/myapp:1.0.0          # Specific version (most reproducible)
username/myapp:1.0            # Minor version tag (floating)
username/myapp:latest          # Most recent tag (avoid in production!)
username/myapp:sha-a1b2c3d4   # Git SHA tag (traceable to source commit)</code></pre>
            <h3>Private Registries</h3>
            <p>For enterprise use, you may want a private registry. Popular options include:</p>
            <ul>
              <li><strong>Docker Trusted Registry (DTR):</strong> Docker's enterprise registry with security scanning.</li>
              <li><strong>Amazon ECR:</strong> AWS Elastic Container Registry, tightly integrated with IAM.</li>
              <li><strong>Google Artifact Registry:</strong> GCP's managed registry with vulnerability scanning.</li>
              <li><strong>GitHub Container Registry (ghcr.io):</strong> Integrated with GitHub Packages and Actions.</li>
              <li><strong>Self-hosted Registry:</strong> <code>docker run -d -p 5000:5000 --name registry registry:2</code></li>
            </ul>
            <pre><code># Authenticate to a private registry
docker login ghcr.io -u username

# Tag and push to a private registry
docker tag myapp:latest ghcr.io/myorg/myapp:latest
docker push ghcr.io/myorg/myapp:latest

# Pull from a private registry (requires authentication)
docker pull ghcr.io/myorg/myapp:latest</code></pre>
            <div class="summary-takeaways">
              <h4><i class="fas fa-check-circle"></i> Key Takeaways</h4>
              <ul>
                <li>Docker Hub is the default public registry; use <code>docker push/pull</code> to transfer images</li>
                <li>Tag images with semantic versions and avoid relying on <code>:latest</code> in production</li>
                <li>Private registries (ECR, GAR, ghcr.io) provide access control and vulnerability scanning</li>
                <li>You can run a self-hosted registry locally for development or air-gapped environments</li>
              </ul>
            </div>
          </div>
        `,
      },
    ],
    quiz: [
      {
        id: 'q5',
        question: 'What does the "depends_on" directive do in a docker-compose.yml file?',
        options: [
          'Ensures the dependent service is fully ready to accept connections',
          'Controls the startup order of services',
          'Installs missing dependencies inside the container',
          'Mounts external volumes',
        ],
        correct: 1,
      },
      {
        id: 'q6',
        question: 'Which Docker network driver should you use for multi-host communication?',
        options: ['bridge', 'host', 'overlay', 'macvlan'],
        correct: 2,
      },
      {
        id: 'q7',
        question: 'What happens to data in a container\'s writable layer when the container is removed?',
        options: [
          'It is preserved automatically',
          'It is lost because containers are ephemeral',
          'It is synced to Docker Hub',
          'It is converted into an image',
        ],
        correct: 1,
      },
      {
        id: 'q8',
        question: 'Which command tags an image for pushing to a registry?',
        options: ['docker tag', 'docker push', 'docker label', 'docker name'],
        correct: 0,
      },
    ],
  },
  {
    id: 'mod-3',
    title: 'Kubernetes Essentials',
    icon: 'fa-dharmachakra',
    lessons: [
      {
        id: 'm3-l1',
        title: 'Kubernetes Architecture & Core Concepts',
        content: `
          <div class="lesson-prose">
            <div class="learning-objectives">
              <h4><i class="fas fa-bullseye"></i> Learning Objectives</h4>
              <ul>
                <li>Understand the Kubernetes control plane and node architecture</li>
                <li>Explain the roles of key components: API Server, Scheduler, Controller Manager, etcd, Kubelet</li>
                <li>Differentiate between Pods, Nodes, and Clusters</li>
              </ul>
            </div>
            <h2>What is Kubernetes?</h2>
            <p>Kubernetes (K8s) is an open-source platform for automating the deployment, scaling, and management of containerized applications. It groups containers into logical units for easy management and discovery.</p>
            <h3>Cluster Architecture</h3>
            <p>A Kubernetes cluster consists of two main parts: the <strong>Control Plane</strong> and the <strong>Worker Nodes</strong>.</p>
            <h3>Control Plane Components</h3>
            <ul>
              <li><strong>kube-apiserver:</strong> The front door to the cluster. All administrative communication goes through the API Server, which validates and processes REST requests.</li>
              <li><strong>etcd:</strong> A distributed key-value store that holds the entire cluster state — configuration, secrets, and resource definitions.</li>
              <li><strong>kube-scheduler:</strong> Watches for newly created Pods without a node assignment and selects the best node for them based on resource requirements, policies, and constraints.</li>
              <li><strong>kube-controller-manager:</strong> Runs controller processes (Node Controller, Replication Controller, etc.) that regulate cluster state toward the desired state.</li>
            </ul>
            <h3>Worker Node Components</h3>
            <ul>
              <li><strong>kubelet:</strong> An agent running on each node that ensures containers in Pods are running and healthy.</li>
              <li><strong>kube-proxy:</strong> Maintains network rules on each node, enabling communication to Pods across the cluster.</li>
              <li><strong>Container Runtime:</strong> The software that runs containers (containerd, CRI-O, or Docker).</li>
            </ul>
            <h3>Core Resource Hierarchy</h3>
            <ul>
              <li><strong>Cluster:</strong> The entire Kubernetes deployment (one or more nodes + control plane).</li>
              <li><strong>Node:</strong> A single machine (physical or virtual) in the cluster.</li>
              <li><strong>Pod:</strong> The smallest deployable unit — one or more containers that share networking and storage.</li>
              <li><strong>Namespace:</strong> A virtual cluster within a physical cluster for organizing resources.</li>
            </ul>
            <pre><code># Check cluster info
kubectl cluster-info

# List all nodes
kubectl get nodes

# List pods in the default namespace
kubectl get pods</code></pre>
            <div class="summary-takeaways">
              <h4><i class="fas fa-check-circle"></i> Key Takeaways</h4>
              <ul>
                <li>Kubernetes orchestrates containers across a cluster of machines</li>
                <li>The control plane (API Server, etcd, Scheduler, Controller Manager) manages cluster state</li>
                <li>Worker nodes run Pods via the kubelet agent and container runtime</li>
                <li>A Pod is the smallest unit in Kubernetes, wrapping one or more containers</li>
              </ul>
            </div>
          </div>
        `,
      },
      {
        id: 'm3-l2',
        title: 'Pods, Deployments & Services',
        content: `
          <div class="lesson-prose">
            <div class="learning-objectives">
              <h4><i class="fas fa-bullseye"></i> Learning Objectives</h4>
              <ul>
                <li>Create and manage Pods using declarative YAML manifests</li>
                <li>Use Deployments for rolling updates, scaling, and self-healing</li>
                <li>Expose applications via Services using ClusterIP, NodePort, and LoadBalancer types</li>
              </ul>
            </div>
            <h2>Kubernetes Pods</h2>
            <p>A <strong>Pod</strong> is the smallest and simplest Kubernetes object. It represents a single instance of a running process. Pods typically run one main container, but can also run sidecar containers that support the main workload (e.g., log collectors, proxies).</p>
            <pre><code>apiVersion: v1
kind: Pod
metadata:
  name: myapp-pod
  labels:
    app: myapp
spec:
  containers:
  - name: myapp-container
    image: nginx:latest
    ports:
    - containerPort: 80</code></pre>
            <h3>Deployments: Declarative Updates</h3>
            <p>A <strong>Deployment</strong> manages a set of identical Pods (a ReplicaSet). It provides declarative updates, scaling, and self-healing. If a Pod crashes, the Deployment automatically replaces it.</p>
            <pre><code>apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myapp:1.0.0
        ports:
        - containerPort: 3000</code></pre>
            <pre><code>kubectl apply -f deployment.yaml    # Create or update
kubectl scale deployment myapp --replicas=5  # Scale up
kubectl rollout status deployment myapp      # Check rollout status
kubectl rollout undo deployment myapp        # Rollback to previous version</code></pre>
            <h3>Services: Stable Networking</h3>
            <p>Pods are ephemeral — they come and go, and their IP addresses change. A <strong>Service</strong> provides a stable endpoint (DNS name + IP) to access a set of Pods. Services use label selectors to find the right Pods.</p>
            <ul>
              <li><strong>ClusterIP (default):</strong> Exposes the Service on a cluster-internal IP. Only reachable within the cluster.</li>
              <li><strong>NodePort:</strong> Exposes the Service on each Node's IP at a static port (30000-32767).</li>
              <li><strong>LoadBalancer:</strong> Provisions an external load balancer (cloud provider) and assigns a public IP.</li>
            </ul>
            <pre><code>apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer</code></pre>
            <div class="summary-takeaways">
              <h4><i class="fas fa-check-circle"></i> Key Takeaways</h4>
              <ul>
                <li>Pods are the smallest deployable unit; use Deployments for managing Pod replicas with self-healing</li>
                <li>Deployments support rolling updates, scaling, and rollback via <code>kubectl rollout</code></li>
                <li>Services provide stable network endpoints to access Pods using label selectors</li>
                <li>Choose ClusterIP (internal), NodePort (external on node IP), or LoadBalancer (cloud LB) based on access requirements</li>
              </ul>
            </div>
          </div>
        `,
      },
      {
        id: 'm3-l3',
        title: 'ConfigMaps, Secrets & Ingress',
        content: `
          <div class="lesson-prose">
            <div class="learning-objectives">
              <h4><i class="fas fa-bullseye"></i> Learning Objectives</h4>
              <ul>
                <li>Decouple configuration from containers using ConfigMaps</li>
                <li>Manage sensitive data securely with Secrets</li>
                <li>Configure Ingress rules for HTTP/HTTPS routing to Services</li>
              </ul>
            </div>
            <h2>ConfigMaps</h2>
            <p>A <strong>ConfigMap</strong> allows you to decouple environment-specific configuration from your container images. Configuration data (e.g., database URLs, feature flags, app settings) is stored in ConfigMaps and injected into Pods as environment variables or mounted as files.</p>
            <pre><code>apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  APP_ENV: production
  LOG_LEVEL: info
  API_URL: https://api.example.com</code></pre>
            <pre><code># Inject as environment variables
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: app
    envFrom:
    - configMapRef:
        name: app-config</code></pre>
            <h3>Secrets</h3>
            <p><strong>Secrets</strong> are similar to ConfigMaps but designed for sensitive data (passwords, API keys, TLS certificates). Secret values are base64-encoded and can be encrypted at rest with etcd encryption.</p>
            <pre><code># Create a Secret from literal values
kubectl create secret generic db-credentials \
  --from-literal=username=admin \
  --from-literal=password=s3cret

# Or from a file
kubectl create secret generic tls-cert \
  --from-file=tls.crt=server.crt \
  --from-file=tls.key=server.key</code></pre>
            <pre><code>apiVersion: v1
kind: Pod
spec:
  containers:
  - name: app
    env:
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: password</code></pre>
            <h3>Ingress</h3>
            <p>While Services expose Pods, an <strong>Ingress</strong> manages external HTTP/HTTPS access to those Services. Ingress provides host-based and path-based routing, TLS termination, and load balancing — all within the cluster.</p>
            <pre><code>apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
spec:
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80</code></pre>
            <p>An Ingress controller (like Nginx Ingress Controller or AWS ALB Ingress Controller) must be deployed in the cluster to satisfy Ingress resources. Without a controller, Ingress definitions are inert.</p>
            <div class="summary-takeaways">
              <h4><i class="fas fa-check-circle"></i> Key Takeaways</h4>
              <ul>
                <li>ConfigMaps keep configuration out of container images for environment portability</li>
                <li>Secrets store sensitive data with base64 encoding and optional encryption at rest</li>
                <li>Both ConfigMaps and Secrets can be injected as environment variables or volume mounts</li>
                <li>Ingress provides host/path-based routing and TLS termination; requires a controller to work</li>
              </ul>
            </div>
          </div>
        `,
      },
    ],
    quiz: [
      {
        id: 'q9',
        question: 'Which component is the front door to the Kubernetes control plane?',
        options: ['kube-scheduler', 'etcd', 'kube-apiserver', 'kube-controller-manager'],
        correct: 2,
      },
      {
        id: 'q10',
        question: 'What is the smallest deployable unit in Kubernetes?',
        options: ['Container', 'Pod', 'Node', 'Service'],
        correct: 1,
      },
      {
        id: 'q11',
        question: 'Which Kubernetes resource provides self-healing, scaling, and rolling updates for Pods?',
        options: ['Service', 'ConfigMap', 'Deployment', 'Ingress'],
        correct: 2,
      },
      {
        id: 'q12',
        question: 'What is the purpose of a Kubernetes Secret?',
        options: [
          'To store application log files',
          'To manage sensitive data like passwords and API keys',
          'To define network policies',
          'To schedule Pods across nodes',
        ],
        correct: 1,
      },
    ],
  },
  {
    id: 'mod-4',
    title: 'Production & Deployment',
    icon: 'fa-rocket',
    lessons: [
      {
        id: 'm4-l1',
        title: 'Docker Security & Best Practices',
        content: `
          <div class="lesson-prose">
            <div class="learning-objectives">
              <h4><i class="fas fa-bullseye"></i> Learning Objectives</h4>
              <ul>
                <li>Identify common Docker security risks and mitigation strategies</li>
                <li>Implement least-privilege principles for containerized applications</li>
                <li>Use image scanning and content trust to ensure supply chain security</li>
              </ul>
            </div>
            <h2>Docker Security Principles</h2>
            <p>Container security follows the same principles as general application security, but with container-specific considerations. The core principle is <strong>defense in depth</strong> — multiple layers of security rather than a single safeguard.</p>
            <h3>1. Run as Non-Root User</h3>
            <p>By default, containers run as root. If an attacker compromises a root-running container, they gain root access on the host (in privileged mode). Always add a <code>USER</code> directive:</p>
            <pre><code># Good
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Even better: drop all capabilities
RUN setcap cap_net_bind_service=+ep /usr/local/bin/server
USER 1000:1000</code></pre>
            <h3>2. Read-Only Root Filesystem</h3>
            <p>Make the container's filesystem read-only at runtime. Only explicitly mounted volumes are writable. This prevents attackers from modifying system binaries:</p>
            <pre><code>docker run --read-only --tmpfs /tmp myapp:latest</code></pre>
            <h3>3. Image Vulnerability Scanning</h3>
            <p>Scan images for known CVEs before deploying. Tools like <code>docker scout</code>, Trivy, Snyk, and Grype integrate into CI/CD pipelines:</p>
            <pre><code>docker scout quickview myapp:latest
trivy image myapp:latest</code></pre>
            <h3>4. Least Privilege: Capabilities</h3>
            <p>Instead of granting all Linux capabilities (<code>--privileged</code>), drop all and add only what is needed:</p>
            <pre><code>docker run --cap-drop ALL --cap-add NET_BIND_SERVICE myapp:latest</code></pre>
            <h3>5. Resource Limits</h3>
            <p>Prevent DoS attacks by limiting CPU and memory per container:</p>
            <pre><code>docker run --memory=512m --cpus=0.5 myapp:latest</code></pre>
            <h3>6. Docker Content Trust</h3>
            <p>Enable content trust to ensure images are signed and verified before pulling. This prevents man-in-the-middle attacks and ensures image integrity:</p>
            <pre><code>export DOCKER_CONTENT_TRUST=1
docker pull myapp:latest    # Will only pull if signed</code></pre>
            <div class="summary-takeaways">
              <h4><i class="fas fa-check-circle"></i> Key Takeaways</h4>
              <ul>
                <li>Always run containers as a non-root user with the USER directive</li>
                <li>Make the root filesystem read-only and drop unnecessary Linux capabilities</li>
                <li>Scan images for vulnerabilities before every deployment</li>
                <li>Set resource limits (CPU, memory) to prevent resource exhaustion attacks</li>
                <li>Enable Docker Content Trust for supply chain integrity</li>
              </ul>
            </div>
          </div>
        `,
      },
      {
        id: 'm4-l2',
        title: 'CI/CD with Docker & GitHub Actions',
        content: `
          <div class="lesson-prose">
            <div class="learning-objectives">
              <h4><i class="fas fa-bullseye"></i> Learning Objectives</h4>
              <ul>
                <li>Build and push Docker images in a CI/CD pipeline</li>
                <li>Implement automated testing and security scanning in CI workflows</li>
                <li>Deploy containerized applications to Kubernetes from GitHub Actions</li>
              </ul>
            </div>
            <h2>CI/CD Fundamentals with Docker</h2>
            <p>Docker makes CI/CD pipelines reproducible — the same image built in CI runs identically in staging and production. <strong>GitHub Actions</strong> provides a powerful platform for automating the entire container lifecycle.</p>
            <h3>Sample Pipeline: Build, Test, Scan, Push, Deploy</h3>
            <pre><code>name: Docker CI/CD

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: Build and tag image
        run: |
          docker build -t \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }} .
          docker tag \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }} \
            \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:latest

      - name: Run container tests
        run: |
          docker compose -f docker-compose.test.yml up --abort-on-container-exit

      - name: Security scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }}
          format: sarif

      - name: Push images
        run: |
          docker push \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }}
          docker push \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:latest</code></pre>
            <h3>Best Practices for Container CI/CD</h3>
            <ul>
              <li><strong>Tag with Git SHA:</strong> Always use the commit SHA as the primary image tag for traceability.</li>
              <li><strong>Test the container, not just the code:</strong> Run <code>docker compose up</code> in CI and test the running containers.</li>
              <li><strong>Scan before pushing:</strong> Integrate vulnerability scanning before images reach the registry.</li>
              <li><strong>Use OIDC:</strong> Authenticate to cloud providers using OpenID Connect instead of long-lived secrets.</li>
              <li><strong>Cache Docker layers:</strong> Use GitHub Actions cache actions to speed up builds.</li>
            </ul>
            <h3>Deploying to Kubernetes from CI</h3>
            <pre><code>      - name: Deploy to Kubernetes
        uses: azure/setup-kubectl@v4
      - run: |
          kubectl set image deployment/myapp \
            myapp=\${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }}
</code></pre>
            <div class="summary-takeaways">
              <h4><i class="fas fa-check-circle"></i> Key Takeaways</h4>
              <ul>
                <li>Docker ensures CI/CD pipelines are fully reproducible across environments</li>
                <li>Tag images with Git SHA for traceability and auditability</li>
                <li>Run container-level tests and vulnerability scans before pushing images</li>
                <li>Use OIDC-based authentication and Docker layer caching for efficient pipelines</li>
              </ul>
            </div>
          </div>
        `,
      },
      {
        id: 'm4-l3',
        title: 'Helm Charts & Production Cluster Management',
        content: `
          <div class="lesson-prose">
            <div class="learning-objectives">
              <h4><i class="fas fa-bullseye"></i> Learning Objectives</h4>
              <ul>
                <li>Understand Helm's architecture and the chart packaging model</li>
                <li>Install, upgrade, and rollback applications using Helm</li>
                <li>Manage production clusters with namespace isolation, resource quotas, and monitoring</li>
              </ul>
            </div>
            <h2>What is Helm?</h2>
            <p><strong>Helm</strong> is the package manager for Kubernetes. It bundles related Kubernetes YAML manifests into a single <strong>chart</strong> — a versioned, reusable, and configurable package. Think of Helm as "apt-get" or "npm" for Kubernetes.</p>
            <h3>Helm Architecture</h3>
            <ul>
              <li><strong>Chart:</strong> A collection of template files describing Kubernetes resources.</li>
              <li><strong>Config:</strong> Values provided at install/upgrade time (<code>values.yaml</code> or <code>--set</code> flags).</li>
              <li><strong>Release:</strong> A running instance of a chart in a cluster.</li>
              <li><strong>Repository:</strong> A place where charts are indexed and shared.</li>
            </ul>
            <pre><code># Add a chart repository
helm repo add bitnami https://charts.bitnami.com/bitnami

# Install a chart with custom values
helm install my-release bitnami/nginx \
  --set service.type=LoadBalancer \
  --set replicaCount=3

# List releases
helm list

# Upgrade a release with a new version
helm upgrade my-release bitnami/nginx --version 18.0.0

# Rollback to a previous revision
helm rollback my-release 1</code></pre>
            <h3>Chart Structure</h3>
            <pre><code>mychart/
  Chart.yaml          # Metadata: name, version, description
  values.yaml         # Default configuration values
  charts/             # Sub-chart dependencies
  templates/          # Go-template YAML files
    deployment.yaml
    service.yaml
    ingress.yaml
    _helpers.tpl      # Template helper functions
  README.md</code></pre>
            <h3>Production Cluster Management</h3>
            <p>Running Kubernetes in production requires more than just deploying workloads. Key operational practices include:</p>
            <ul>
              <li><strong>Namespace Isolation:</strong> Separate environments (dev, staging, prod) into different namespaces with <code>ResourceQuota</code> limits.</li>
              <li><strong>Horizontal Pod Autoscaling:</strong> Automatically scale Pod replicas based on CPU/memory utilization or custom metrics.</li>
              <li><strong>Monitoring & Observability:</strong> Deploy Prometheus + Grafana for metrics, and Fluentd/Loki for log aggregation.</li>
              <li><strong>Pod Disruption Budgets:</strong> Ensure minimum availability during voluntary disruptions (node maintenance, upgrades).</li>
              <li><strong>Network Policies:</strong> Control traffic flow between Pods using <code>NetworkPolicy</code> resources.</li>
              <li><strong>Cluster Upgrades:</strong> Follow a phased upgrade strategy: control plane first, then worker nodes, one at a time.</li>
            </ul>
            <pre><code># Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70</code></pre>
            <div class="summary-takeaways">
              <h4><i class="fas fa-check-circle"></i> Key Takeaways</h4>
              <ul>
                <li>Helm packages Kubernetes manifests into reusable, versioned charts</li>
                <li>Use <code>helm install</code>, <code>helm upgrade</code>, and <code>helm rollback</code> for lifecycle management</li>
                <li>Production clusters need namespace isolation, HPA, monitoring, and network policies</li>
                <li>Always use Pod Disruption Budgets to maintain availability during maintenance</li>
              </ul>
            </div>
          </div>
        `,
      },
    ],
    quiz: [
      {
        id: 'q13',
        question: 'Which Docker security practice prevents attackers from modifying system binaries at runtime?',
        options: [
          'Using the latest base image',
          'Setting a read-only root filesystem',
          'Running as root user',
          'Exposing all ports',
        ],
        correct: 1,
      },
      {
        id: 'q14',
        question: 'What is the recommended Docker image tagging strategy for production CI/CD?',
        options: [
          'Always use :latest so you get the newest version',
          'Tag with the Git commit SHA for traceability',
          'Use random UUIDs as tags',
          'Never tag images, only use image IDs',
        ],
        correct: 1,
      },
      {
        id: 'q15',
        question: 'In Helm, what is a running instance of a chart called?',
        options: ['Package', 'Release', 'Pod', 'Deployment'],
        correct: 1,
      },
      {
        id: 'q16',
        question: 'Which Kubernetes resource ensures minimum availability during voluntary disruptions?',
        options: ['HorizontalPodAutoscaler', 'PodDisruptionBudget', 'NetworkPolicy', 'ResourceQuota'],
        correct: 1,
      },
    ],
  },
];

const DOM = {
  sidebarContent: document.getElementById('sidebar-content'),
  lessonTitle: document.getElementById('lesson-title'),
  lessonBody: document.getElementById('lesson-body'),
  prevBtn: document.getElementById('prev-btn'),
  nextBtn: document.getElementById('next-btn'),
  markCompleteBtn: document.getElementById('mark-complete-btn'),
  progressBar: document.getElementById('progress-bar'),
  progressText: document.getElementById('progress-text'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  terminalInput: document.getElementById('terminal-input'),
  terminalOutput: document.getElementById('terminal-output'),
  quizContainer: document.getElementById('quiz-container'),
};

function init() {
  renderSidebar();
  loadLesson(activeModule, activeLesson);
  updateProgress();
  setupEventListeners();
}

function getTotalFlatLessons() {
  return curriculum.reduce((sum, mod) => sum + mod.lessons.length, 0);
}

function getCurrentFlatIndex() {
  let count = 0;
  for (let m = 0; m < curriculum.length; m++) {
    for (let l = 0; l < curriculum[m].lessons.length; l++) {
      if (m === activeModule && l === activeLesson) return count;
      count++;
    }
  }
  return 0;
}

function getLessonFromFlat(flatIndex) {
  let count = 0;
  for (let m = 0; m < curriculum.length; m++) {
    for (let l = 0; l < curriculum[m].lessons.length; l++) {
      if (count === flatIndex) return { mIndex: m, lIndex: l };
      count++;
    }
  }
  return { mIndex: 0, lIndex: 0 };
}

function renderSidebar() {
  let html = '';
  curriculum.forEach((mod, mIndex) => {
    const moduleIcon = mod.icon || (mod.id === 'mod-1' ? 'fa-docker' : 'fa-cubes');
    const iconPrefix = mIndex === 0 ? 'fab' : 'fas';
    html += '<div class="mb-3">';
    html += `<div class="module-header"><i class="${iconPrefix} ${moduleIcon} mr-2"></i>${mod.title}</div>`;
    html += '<ul class="space-y-1">';
    mod.lessons.forEach((lesson, lIndex) => {
      const isCompleted = userProgress.completedLessons.includes(lesson.id);
      const isActive = mIndex === activeModule && lIndex === activeLesson;
      html += `<li class="sidebar-item sidebar-lesson-item" data-module="${mIndex}" data-lesson="${lIndex}">`;
      html += `<div class="sidebar-item-content flex items-center justify-between p-3 rounded-lg text-gray-700 bg-gray-50 border border-gray-100 ${isActive ? 'active' : ''}" style="padding-left: 1.5rem;">`;
      html += '<div class="flex items-center gap-3">';
      html += `<span class="text-sm font-medium">${lesson.title}</span>`;
      html += '</div>';
      html += isCompleted ? '<i class="fas fa-check-circle completed-check"></i>' : '';
      html += '</div></li>';
    });
    html += '</ul></div>';
  });
  DOM.sidebarContent.innerHTML = html;
}

function loadLesson(mIndex, lIndex) {
  activeModule = mIndex;
  activeLesson = lIndex;
  const lesson = curriculum[mIndex].lessons[lIndex];

  DOM.lessonTitle.textContent = lesson.title;

  const eli5 = window.eli5Toggle;
  const simpleContent =
    window.eli5DockerK8sData && lesson.id
      ? window.eli5DockerK8sData[lesson.id] || ''
      : '';

  DOM.lessonBody.innerHTML = eli5
    ? eli5.wrapContent(lesson.content, simpleContent)
    : lesson.content;

  if (eli5) {
    eli5.initToggle('docker-k8s', DOM.lessonBody);
  }

  copyCode.init(DOM.lessonBody);

  const flatIndex = getCurrentFlatIndex();
  const totalLessons = getTotalFlatLessons();
  DOM.prevBtn.style.visibility = flatIndex === 0 ? 'hidden' : 'visible';
  DOM.nextBtn.style.visibility = flatIndex === totalLessons - 1 ? 'hidden' : 'visible';

  const isCompleted = userProgress.completedLessons.includes(lesson.id);
  DOM.markCompleteBtn.innerHTML = isCompleted
    ? 'Completed <i class="fas fa-check-double ml-2"></i>'
    : 'Mark as Read <i class="fas fa-check ml-2"></i>';
  DOM.markCompleteBtn.className = isCompleted
    ? 'px-5 py-2.5 rounded-lg bg-green-600 text-white font-medium shadow-sm'
    : 'px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium shadow-sm';

  renderQuiz(mIndex);
  renderSidebar();

  if (window.innerWidth < 768) {
    document.getElementById('sidebar').classList.add('-translate-x-full');
  }
}

function updateProgress() {
  const allLessonIds = curriculum.flatMap(mod => mod.lessons.map(l => l.id));
  const allQuizIds = curriculum.flatMap(mod => mod.quiz.map(q => q.id));
  const totalItems = allLessonIds.length + allQuizIds.length;
  const completedItems = userProgress.completedLessons.length + userProgress.completedQuizzes.length;
  const percent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  DOM.progressBar.style.width = percent + '%';
  DOM.progressText.textContent = percent + '%';
}

function renderQuiz(mIndex) {
  const quiz = curriculum[mIndex].quiz;
  let html = `<h2 class="text-2xl font-bold mb-2 text-gray-800">Module Knowledge Check</h2>`;
  html += `<div class="quiz-module-badge"><i class="fas fa-layer-group mr-1"></i> ${curriculum[mIndex].title}</div>`;
  html += `<p class="text-sm text-gray-500 mb-6">Answer the questions for this module to test your understanding.</p>`;

  if (!quiz || quiz.length === 0) {
    DOM.quizContainer.innerHTML = html + '<p class="text-gray-400 italic">No quiz for this module.</p>';
    return;
  }

  quiz.forEach((q, i) => {
    const isCompleted = userProgress.completedQuizzes.includes(q.id);
    html += `
      <div class="p-6 rounded-lg border quiz-question ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-100'}" id="q-container-${q.id}">
        <p class="font-semibold text-lg text-gray-800 mb-4">${i + 1}. ${q.question}</p>
        <div class="space-y-2">
    `;
    q.options.forEach((opt, oIndex) => {
      const checked = isCompleted && oIndex === q.correct ? 'checked' : '';
      const disabled = isCompleted ? 'disabled' : '';
      html += `
        <label class="flex items-center p-3 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors ${isCompleted ? 'opacity-75' : ''}">
          <input type="radio" name="quiz-${q.id}" value="${oIndex}" class="mr-3 w-4 h-4 text-blue-600" ${checked} ${disabled}>
          <span class="text-gray-700">${opt}</span>
        </label>
      `;
    });
    html += `
        </div>
        <button data-quiz-id="${q.id}" data-module="${mIndex}" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors ${isCompleted ? 'opacity-50 cursor-not-allowed' : ''}" ${isCompleted ? 'disabled' : ''}>
          ${isCompleted ? 'Already Answered' : 'Submit Answer'}
        </button>
        <div id="q-feedback-${q.id}" class="mt-3 hidden text-sm font-medium"></div>
        ${isCompleted ? '<div class="mt-2 text-sm text-green-600 font-medium"><i class="fas fa-check-circle mr-1"></i> Answered correctly</div>' : ''}
      </div>
    `;
  });

  DOM.quizContainer.innerHTML = html;
}

function checkAnswer(qId, mIndex) {
  const quiz = curriculum[mIndex].quiz;
  const q = quiz.find(item => item.id === qId);
  if (!q) return;

  const selected = document.querySelector(`input[name="quiz-${qId}"]:checked`);
  const feedback = document.getElementById(`q-feedback-${qId}`);
  const container = document.getElementById(`q-container-${qId}`);

  if (!selected) {
    feedback.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i> Please select an answer.';
    feedback.className = 'mt-3 text-sm font-medium text-amber-600 block';
    return;
  }

  if (parseInt(selected.value) === q.correct) {
    feedback.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Correct! Great job.';
    feedback.className = 'mt-3 text-sm font-medium text-green-600 block';
    container.classList.remove('bg-blue-50', 'border-blue-100');
    container.classList.add('bg-green-50', 'border-green-200');

    if (!userProgress.completedQuizzes.includes(qId)) {
      userProgress.completedQuizzes.push(qId);
      try {
        localStorage.setItem('dockerK8sProgress', JSON.stringify(userProgress));
      } catch (e) {}
      updateProgress();
      const btn = container.querySelector('button[data-quiz-id]');
      if (btn) {
        btn.textContent = 'Already Answered';
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        btn.classList.remove('hover:bg-blue-700');
      }
      container.querySelectorAll('input[type="radio"]').forEach(r => r.disabled = true);
      const alreadyAnswered = container.querySelector('.answered-correctly');
      if (!alreadyAnswered) {
        const badge = document.createElement('div');
        badge.className = 'mt-2 text-sm text-green-600 font-medium answered-correctly';
        badge.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Answered correctly';
        container.appendChild(badge);
      }
    }
  } else {
    feedback.innerHTML = '<i class="fas fa-times-circle mr-1"></i> Incorrect. Try again.';
    feedback.className = 'mt-3 text-sm font-medium text-red-600 block';
  }
}

function handleTerminalCommand(cmd) {
  const args = cmd.trim().split(' ').filter(c => c !== '');
  if (args.length === 0) return;

  const inputEcho = document.createElement('div');
  inputEcho.innerHTML = `<span class="text-blue-400">$</span> ${cmd}`;
  DOM.terminalOutput.appendChild(inputEcho);

  let response = '';
  const base = args[0];
  if (base === 'help') {
    response = 'Available commands: docker, kubectl, clear, help';
  } else if (base === 'clear') {
    DOM.terminalOutput.innerHTML = '';
    return;
  } else if (base === 'docker') {
    if (args[1] === 'ps') {
      response = 'CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES';
    } else if (args[1] === 'run') {
      response = 'Unable to find image locally... Pulling from library...';
    } else if (args[1] === 'images') {
      response = 'REPOSITORY   TAG       IMAGE ID       CREATED      SIZE\nnginx        latest    abc123def456   2 days ago   187MB\nmyapp        1.0.0     def789ghi012   5 days ago   45MB';
    } else if (args[1] === 'compose') {
      response = 'Docker Compose is a tool for defining and running multi-container applications.';
    } else {
      response = 'Usage: docker [OPTIONS] COMMAND\n\nA self-sufficient runtime for containers.';
    }
  } else if (base === 'kubectl') {
    if (args[1] === 'get' && args[2] === 'pods') {
      response = 'NAME                     READY   STATUS    RESTARTS   AGE\nmyapp-6b4d9f8c7f-abcde   1/1     Running   0          2d\nmyapp-6b4d9f8c7f-fghij   1/1     Running   0          2d\nmyapp-6b4d9f8c7f-klmno   1/1     Running   0          2d';
    } else if (args[1] === 'get' && args[2] === 'nodes') {
      response = 'NAME      STATUS   ROLES    AGE   VERSION\nnode-1    Ready    <none>   30d   v1.28\nnode-2    Ready    <none>   30d   v1.28\nnode-3    Ready    <none>   30d   v1.28';
    } else if (args[1] === 'get' && args[2] === 'services') {
      response = 'NAME           TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE\nmyapp-service   LoadBalancer   10.96.1.100     <pending>     80:30080/TCP   2d';
    } else {
      response = 'kubectl controls the Kubernetes cluster manager.\n\nUsage: kubectl [command] [TYPE] [NAME] [flags]';
    }
  } else {
    response = `bash: ${base}: command not found`;
  }

  if (response) {
    const outputLine = document.createElement('div');
    outputLine.className = 'text-gray-300 whitespace-pre-wrap';
    outputLine.textContent = response;
    DOM.terminalOutput.appendChild(outputLine);
  }

  DOM.terminalOutput.scrollTop = DOM.terminalOutput.scrollHeight;
}

function setupEventListeners() {
  DOM.prevBtn.addEventListener('click', () => {
    const flatIndex = getCurrentFlatIndex();
    if (flatIndex > 0) {
      const pos = getLessonFromFlat(flatIndex - 1);
      loadLesson(pos.mIndex, pos.lIndex);
    }
  });

  DOM.nextBtn.addEventListener('click', () => {
    const flatIndex = getCurrentFlatIndex();
    const totalLessons = getTotalFlatLessons();
    if (flatIndex < totalLessons - 1) {
      const pos = getLessonFromFlat(flatIndex + 1);
      loadLesson(pos.mIndex, pos.lIndex);
    }
  });

  DOM.markCompleteBtn.addEventListener('click', () => {
    const lesson = curriculum[activeModule].lessons[activeLesson];
    if (!userProgress.completedLessons.includes(lesson.id)) {
      userProgress.completedLessons.push(lesson.id);
      localStorage.setItem('dockerK8sProgress', JSON.stringify(userProgress));
      updateProgress();
      loadLesson(activeModule, activeLesson);
    }
  });

  DOM.tabBtns.forEach((tab) => {
    tab.addEventListener('click', () => {
      DOM.tabBtns.forEach(t => {
        t.classList.remove('active', 'border-blue-600', 'text-blue-700');
        t.classList.add('border-transparent', 'text-gray-500');
      });
      tab.classList.remove('border-transparent', 'text-gray-500');
      tab.classList.add('active', 'border-blue-600', 'text-blue-700');

      DOM.tabContents.forEach(content => content.classList.add('hidden'));
      document.getElementById(tab.dataset.tab + '-tab').classList.remove('hidden');

      if (tab.dataset.tab === 'quiz') {
        renderQuiz(activeModule);
      }

      if (tab.dataset.tab === 'simulator') {
        DOM.terminalInput.focus();
      }
    });
  });

  DOM.terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleTerminalCommand(DOM.terminalInput.value);
      DOM.terminalInput.value = '';
    }
  });

  DOM.quizContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-quiz-id]');
    if (btn && !btn.disabled) {
      checkAnswer(btn.dataset.quizId, parseInt(btn.dataset.module));
    }
  });

  DOM.sidebarContent.addEventListener('click', (e) => {
    const item = e.target.closest('.sidebar-lesson-item');
    if (item) {
      const mIndex = parseInt(item.dataset.module);
      const lIndex = parseInt(item.dataset.lesson);
      switchTab('lesson');
      loadLesson(mIndex, lIndex);
    }
  });

  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
  });
}

function switchTab(tabId) {
  DOM.tabBtns.forEach(t => {
    t.classList.remove('active', 'border-blue-600', 'text-blue-700');
    t.classList.add('border-transparent', 'text-gray-500');
    if (t.dataset.tab === tabId) {
      t.classList.remove('border-transparent', 'text-gray-500');
      t.classList.add('active', 'border-blue-600', 'text-blue-700');
    }
  });
  DOM.tabContents.forEach(content => content.classList.add('hidden'));
  document.getElementById(tabId + '-tab').classList.remove('hidden');
}

init();
