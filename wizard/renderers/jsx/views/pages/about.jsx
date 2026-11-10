import { Layout } from "../layouts/page.jsx";

export default function Page(data) {
  return (
    <Layout {...data}>
      <section class="about">
        <h1 class="about__title" data-about-title data-animation="title">
          {data.route.title}
        </h1>
        <p class="about__body">{data.route.description}</p>
        <p>
          <a class="internal-link" href="/">
            Home
          </a>
        </p>
      </section>
    </Layout>
  );
}
