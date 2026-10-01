document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        const participants = details.participants || [];
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeader = document.createElement("div");
        participantsHeader.className = "participants-header";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";

        const participantCount = document.createElement("span");
        participantCount.className = "participant-count";
        participantCount.textContent = `${participants.length} signed up`;

        participantsHeader.append(participantsHeading, participantCount);
        participantsSection.appendChild(participantsHeader);

        if (participants.length > 0) {
          const participantsList = document.createElement("ul");
          participantsList.className = "participants-list";

          participants.forEach((participant) => {
            const participantItem = document.createElement("li");

            const participantName = document.createElement("span");
            participantName.className = "participant-name";
            participantName.textContent = participant;

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "remove-participant";
            removeButton.textContent = "x";
            removeButton.title = `Remove ${participant} from ${name}`;
            removeButton.setAttribute("aria-label", `Remove ${participant} from ${name}`);
            removeButton.addEventListener("click", async () => {
              removeButton.disabled = true;
              const removed = await unregisterParticipant(name, participant);
              if (!removed) {
                removeButton.disabled = false;
              }
            });

            participantItem.append(participantName, removeButton);
            participantsList.appendChild(participantItem);
          });

          participantsSection.appendChild(participantsList);
        } else {
          const emptyState = document.createElement("p");
          emptyState.className = "participants-empty";
          emptyState.textContent = "No participants yet";
          participantsSection.appendChild(emptyState);
        }

        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        if (![...activitySelect.options].some((existingOption) => existingOption.value === name)) {
          activitySelect.appendChild(option);
        }
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  async function unregisterParticipant(activityName, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to remove participant");
      }

      messageDiv.textContent = result.message;
      messageDiv.className = "success";
      messageDiv.classList.remove("hidden");
      await fetchActivities();
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
      return true;
    } catch (error) {
      messageDiv.textContent = error.message || "Failed to remove participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      return false;
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
