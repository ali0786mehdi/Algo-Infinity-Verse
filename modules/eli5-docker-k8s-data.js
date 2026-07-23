const eli5DockerK8sData = {
  'm1-l1': `
    <p>Imagine you are moving to a new house. You pack all your stuff into moving boxes. Each box has everything you need — plates, cups, silverware. When you get to the new house, you just open the box and everything is there, exactly how you packed it.</p>
    <p><strong>Docker is like those moving boxes for computer programs.</strong> It wraps up your app with everything it needs to run (libraries, settings, tools) into a neat package called a <strong>container</strong>.</p>
    <p><strong>Containers vs VMs:</strong> Think of containers like apartment buildings — many families share the same building (the computer's operating system). Virtual machines are like separate houses — each has its own foundation, plumbing, and electricity (a full operating system). Apartments are much cheaper and faster to set up!</p>
    <p><strong>Why it matters:</strong> Before Docker, developers would say "But it works on MY computer!" because their setup was different from the server. Docker fixes this — if it runs in your container on your laptop, it will run the same way on any server anywhere.</p>
  `,
  'm1-l2': `
    <p>Think of a <strong>Docker image</strong> like a cake recipe written on a stack of transparent pages. Each page has one instruction: "add flour", "add eggs", "bake at 350°". The whole stack of pages is the recipe (image).</p>
    <p>A <strong>container</strong> is the actual cake you bake from that recipe. You can bake 10 cakes from the same recipe, and each one is independent. If one cake burns, the others are fine.</p>
    <p><strong>Layers explained:</strong> Images are made of layers, like a stack of pancakes. If two recipes both start with "add flour and eggs", Docker notices they are the same and only stores those instructions once. This saves tons of disk space!</p>
    <p><strong>Container lifecycle:</strong> Creating a container is like putting batter in a pan. Running it is like putting it in the oven. Stopping it is like taking it out. Deleting it is like throwing the cake away. The recipe (image) is still safe — you can always bake another cake.</p>
  `,
  'm1-l3': `
    <p>A <strong>Dockerfile</strong> is like a recipe card for your app. Each line is one step. Docker follows the recipe from top to bottom to build your image.</p>
    <p><strong>Layer Caching:</strong> Imagine cooking with a helper who remembers every step. If you make the same recipe again and the first 3 steps haven't changed, the helper says "I already did those steps — let's start from step 4!" This makes rebuilding <strong>super fast</strong>.</p>
    <p><strong>Multi-stage builds:</strong> This is like cooking in two kitchens. In the <strong>prep kitchen</strong>, you chop vegetables, marinate meat, and make a mess. Then you pass only the finished dish to the <strong>serving kitchen</strong>. The serving kitchen stays clean and small — no dirty knives or cutting boards!</p>
    <p>In Docker terms: your build kitchen has all the heavy tools (compilers, SDKs, dev dependencies). Your serving kitchen has just the final app. The result is a <strong>tiny image</strong> — sometimes 10x smaller!</p>
  `,
  'm2-l1': `
    <p>Imagine you are putting on a school play. You have people handling lights, sound, costumes, and actors. Telling each person what to do individually would be chaos!</p>
    <p><strong>Docker Compose</strong> is like having a stage manager with a master script. The script says: "At 7 PM, turn on lights, start music, and bring the actors on stage." Everyone follows one master plan.</p>
    <p>In technical terms: a <strong>docker-compose.yml</strong> file lists all your containers (web app, database, cache) and how they connect. Instead of running 5 separate <code>docker run</code> commands, you run ONE command: <code>docker compose up</code>.</p>
    <p>Containers can also talk to each other by name — like calling your friend by name instead of their phone number. The web app just says "database" and Docker figures out the address.</p>
  `,
  'm2-l2': `
    <p><strong>Networking:</strong> Imagine containers as people in separate rooms. Networking is like installing a phone system so they can call each other. By default, Docker gives each container its own phone line. Containers on the same "bridge" network can dial each other directly.</p>
    <p><strong>Volumes:</strong> A container is like a whiteboard at a coffee shop. When you leave, someone wipes it clean. If you want your notes to survive, you need a notebook you carry with you. A <strong>volume</strong> is that notebook — data that stays safe even when the container is erased.</p>
    <p><strong>Bind Mounts:</strong> This is like having a window between your computer and the container. Any changes you make on your computer instantly appear inside the container. This is great for coding — you edit a file on your laptop, and the container sees the change immediately.</p>
    <p>Remember: without volumes, when a container stops, all its data disappears — like writing in sand at the beach when the tide comes in.</p>
  `,
  'm2-l3': `
    <p><strong>Docker Hub</strong> is like an app store for container images. Instead of cooking everything from scratch, you can download pre-made meals (official images for Node.js, Python, PostgreSQL, Redis, Nginx, etc.).</p>
    <p><strong>Pulling images:</strong> <code>docker pull nginx</code> is like going to the app store and downloading "Nginx" onto your computer. It comes with everything pre-installed and ready to run.</p>
    <p><strong>Pushing images:</strong> When you build your own image, <code>docker push</code> is like publishing your own app to the store. Other people (or your servers) can download it later.</p>
    <p><strong>Tags:</strong> Image tags are like version numbers on a soda can. <code>myapp:1.0.0</code> is a specific recipe. <code>myapp:latest</code> is like "current recipe" — it changes over time. For important things, always use a specific version, not "latest"!</p>
    <p><strong>Private registries:</strong> Companies often use their own private app store (like Amazon ECR or GitHub Container Registry) where only employees can see and download images.</p>
  `,
  'm3-l1': `
    <p>Imagine you are the manager of a big hotel.</p>
    <p><strong>Kubernetes (K8s)</strong> is like a super-smart hotel management system. You tell it: "I want 3 copies of my app running all the time." The system handles everything automatically.</p>
    <p><strong>The hotel analogy:</strong></p>
    <ul>
      <li><strong>Cluster =</strong> The whole hotel building (all floors and rooms together)</li>
      <li><strong>Node =</strong> One floor of the hotel (a computer/server)</li>
      <li><strong>Pod =</strong> A single hotel room (where your app lives)</li>
      <li><strong>API Server =</strong> The front desk — everyone talks to the front desk to make requests</li>
      <li><strong>Scheduler =</strong> The bellhop who decides which floor each guest goes to</li>
      <li><strong>etcd =</strong> The hotel's record book — remembers everything about every guest and room</li>
      <li><strong>Kubelet =</strong> The housekeeper on each floor — makes sure rooms are clean and guests are happy</li>
    </ul>
    <p>If a guest complains (app crashes), Kubernetes automatically moves them to a new room. You don't have to do anything!</p>
  `,
  'm3-l2': `
    <p><strong>Pods:</strong> A Pod is like a small apartment where your app lives. Sometimes an apartment has roommates (multiple containers) that share the same address and utilities. But usually, it's just one container per Pod.</p>
    <p><strong>Deployments:</strong> A Deployment is like a property manager. You tell the manager: "I want exactly 3 apartments occupied at all times." If a tenant moves out (container crashes), the manager immediately finds a new tenant — within seconds! The manager also handles <strong>rolling updates</strong>: upgrading all apartments one at a time so the building is never fully empty.</p>
    <p><strong>Services:</strong> Imagine apartments frequently change tenants and addresses. How would mail get delivered? A <strong>Service</strong> is like the building's mailing address. Even if tenants change, mail sent to "123 Main St, Apt A" always finds the right place.</p>
    <ul>
      <li><strong>ClusterIP:</strong> Internal mail — only works inside the building</li>
      <li><strong>NodePort:</strong> A special delivery door — works from outside too</li>
      <li><strong>LoadBalancer:</strong> A fancy front desk that distributes visitors evenly</li>
    </ul>
  `,
  'm3-l3': `
    <p><strong>ConfigMaps:</strong> Imagine you run a chain of restaurants. Each restaurant has a binder of settings: "Open at 9 AM", "Menu item prices", "Wifi password". Changing a setting in one restaurant is easy, but updating 100 restaurants is a nightmare!</p>
    <p>ConfigMaps are like a central settings binder. All restaurants read from the same binder. Change one setting, and all 100 restaurants update instantly — without rebuilding the restaurant!</p>
    <p><strong>Secrets:</strong> Now imagine some information is super sensitive — like the safe combination or the manager's login password. You wouldn't write this in the regular binder! <strong>Secrets</strong> are like a locked safe. The info is encoded (scrambled) and only apps with the right key can unlock it.</p>
    <p><strong>Ingress:</strong> Think of Ingress like a hotel concierge desk. When guests arrive, they say "I'm here for the API meeting" or "I need the web lobby." The concierge directs them to the right room.</p>
    <p>In technical terms: when someone visits <code>api.myapp.com</code>, Ingress sends them to the API service. When they visit <code>myapp.com</code>, they go to the web service. One front door, many possible destinations!</p>
  `,
  'm4-l1': `
    <p>Docker security is like keeping your house safe. Here are the most important rules:</p>
    <p><strong>1. Don't run as root:</strong> Running as root in a container is like giving every guest the master key to your house. If a bad person gets in, they can change anything! Always create a regular user account inside the container (<code>USER appuser</code>).</p>
    <p><strong>2. Read-only filesystem:</strong> Make your container's files read-only, like a library where you can read books but not write in them. If a hacker gets in, they can't change your app's files. Only allow writing to specific folders (like a designated notebook).</p>
    <p><strong>3. Vulnerability scanning:</strong> Before moving into a house, you'd check for weak spots. <strong>Scanning images</strong> is like checking your container for known security problems. Tools like Trivy or Docker Scout check your image against a database of known issues.</p>
    <p><strong>4. Resource limits:</strong> Set limits on CPU and memory, like telling each guest: "You can use the stove for 30 minutes max." This prevents one runaway app from crashing everything else.</p>
    <p><strong>5. Least privilege:</strong> Don't give your app more permissions than it needs. If your app only needs to serve web pages, don't give it permission to delete files. It's like giving a delivery driver access to only the front door, not the safe in the basement!</p>
  `,
  'm4-l2': `
    <p><strong>CI/CD with Docker</strong> is like an automated pizza factory.</p>
    <p><strong>The factory line:</strong></p>
    <ol>
      <li><strong>Commit code:</strong> A chef writes a new recipe (pushes code to GitHub). This automatically starts the factory line.</li>
      <li><strong>Build:</strong> The factory prepares the pizza with all toppings (builds a Docker image).</li>
      <li><strong>Test:</strong> A quality inspector checks the pizza (automated tests run inside the container).</li>
      <li><strong>Scan:</strong> A safety inspector checks ingredients for problems (vulnerability scan).</li>
      <li><strong>Package:</strong> The pizza is boxed and labeled (pushed to container registry with a version tag).</li>
      <li><strong>Deliver:</strong> The pizza is shipped to the restaurant (deployed to production server).</li>
    </ol>
    <p><strong>GitHub Actions</strong> is the conveyor belt that connects all these steps. When you push code, it automatically triggers the entire pipeline. No human needs to remember each step!</p>
    <p><strong>Why Docker is perfect for CI/CD:</strong> The pizza made in the test kitchen is exactly the same pizza delivered to the restaurant — same ingredients, same recipe, same cooking time. No "but it worked in testing!" surprises.</p>
  `,
  'm4-l3': `
    <p><strong>Helm</strong> is like the "App Store installer" for Kubernetes.</p>
    <p>Imagine installing a complex app on your computer. Without an installer, you'd need to: create folders, download files, set up the database, configure settings, create shortcuts... it's a lot of manual work!</p>
    <p>A <strong>Helm chart</strong> is like a smart installer package. One command — <code>helm install</code> — and everything is set up perfectly: deployments, services, configs, secrets, ingress rules, and more.</p>
    <p><strong>Values:</strong> Charts are customizable. When you install a chart, you provide settings (values) like "I want 3 copies running" or "use this domain name." It's like choosing options when installing software — "Install with 3 servers" or "Install with database enabled."</p>
    <p><strong>Upgrades and rollbacks:</strong> <code>helm upgrade</code> updates your app. If something breaks, <code>helm rollback</code> instantly reverts to the previous working version — like "undo" for your entire app!</p>
    <p><strong>Production management:</strong> Running apps in production is like running a busy restaurant. You need: separate areas for prep and service (namespaces), automatic dishwashers that run when plates pile up (auto-scaling), security cameras (monitoring), and clear rules for busy hours (resource quotas). Kubernetes provides all these tools!</p>
  `,
};

window.eli5DockerK8sData = eli5DockerK8sData;
